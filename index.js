const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { CsvWriter } = require("./src/CsvWriter");

// Comment out the line below to see debug logs
console.debug = function() {};

const PARSERS_DIRECTORY = "./src/parsers";
const OUTPUT_DIRECTORY = "./out";

let parsers = [];

main();

async function main() {
  createOutputDir();
  loadParsers();

  const inputPath = process.argv[2] || '.';

  const pdfFiles = getReceiptPdfFileNames(inputPath);

  if (pdfFiles.length === 0) {
    console.log(chalk.yellow(`No PDF files found in ${inputPath}`));
    return;
  }

  for (const pdfName of pdfFiles) {
    await parseReceiptPdf(pdfName);
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

function getReceiptPdfFileNames(inputPath) {
  if (fs.statSync(inputPath).isFile() && path.extname(inputPath) === ".pdf") {
    return [inputPath];
  }

  if (fs.statSync(inputPath).isDirectory()) {
    return fs.readdirSync(inputPath, { withFileTypes: true })
      .filter(file => file.isFile() && path.extname(file.name) === ".pdf")
      .map(file => path.join(inputPath, file.name));
  }

  return [];
}

async function parseReceiptPdf(pdfName) {
  const { PdfData } = await import("pdfdataextract");
  try {
    const data = await PdfData.extract(fs.readFileSync(pdfName));
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
      console.log(chalk.green(`Successfully parsed ${pdfName} with ${parser.getStoreName()} parser.`));
    } else {
      console.log(chalk.yellow(`No parser found for ${pdfName}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error parsing ${pdfName}:`), error);
  }
}

function writeToCsv(transactions, storeName) {
  if (transactions.length === 0) return;
  
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
