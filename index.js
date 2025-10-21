const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { PdfData } = require("pdfdataextract");
const { CsvWriter } = require("./src/CsvWriter");
const { NumberUtils } = require("./src/NumberUtils");

// Comment out the line below to see debug logs
console.debug = function() {};

const PDFS_DIRECTORY = "./costco-receipt-pdfs";
const PARSERS_DIRECTORY = "./src/parsers";
const OUTPUT_DIRECTORY = "./out";

const numberUtils = new NumberUtils();
let parsers = [];

main();

function main() {
  createOutputDir();
  loadParsers();

  for (const pdfName of getReceiptPdfFileNames()) {
    parseReceiptPdf(pdfName);
  }
}

function loadParsers() {
  const parserFiles = fs.readdirSync(PARSERS_DIRECTORY).filter(file => file.endsWith('.js'));
  for (const file of parserFiles) {
    const parserClass = require(path.join(__dirname, 'src', 'parsers', file));
    parsers.push(new parserClass());
  }
}

function createOutputDir() {
  if (fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.rmSync(OUTPUT_DIRECTORY, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIRECTORY);
}

function getReceiptPdfFileNames() {
  return fs.readdirSync(PDFS_DIRECTORY, { withFileTypes: true })
    .filter(file => file.isFile())
    .filter(file => path.extname(file.name) === ".pdf")
    .map(file => path.join(PDFS_DIRECTORY, file.name));
}

function parseReceiptPdf(pdfName) {
  PdfData.extract(fs.readFileSync(pdfName)).then(data => {
    const fullText = data.text.join("\n");
    let parser = null;

    for (const p of parsers) {
      if (p.canParse(fullText)) {
        parser = p;
        break;
      }
    }

    if (parser) {
      const receiptData = parser.parse(fullText);
      let transactions = receiptData.transactions.map(t => ({
        ...t,
        date: receiptData.date,
        cardLastFour: receiptData.cardLastFour,
        isTaxable: t.isTaxable ? "Y" : "N",
      }));
      writeToCsv(transactions, parser.getStoreName());
    } else {
      console.log(chalk.yellow(`No parser found for ${pdfName}`));
    }
  });
}

function writeToCsv(transactions, storeName) {
  const headers = [
    { id: "date", title: "Date" },
    { id: "itemIdentifier", title: "Item identifier" },
    { id: "itemName", title: "Item name" },
    { id: "amount", title: "Amount" },
    { id: "isTaxable", title: "Taxable" },
    { id: "cardLastFour", title: "Card used" },
  ];

  new CsvWriter({ outputDir: OUTPUT_DIRECTORY, headers: headers, append: true })
    .write(`${storeName.toLowerCase()}-receipts.csv`, transactions);
}
