const ReceiptParser = require('../ReceiptParser');
const { RegexUtils } = require("../RegexUtils");
const { NumberUtils } = require("../NumberUtils");

class CostcoReceiptParser extends ReceiptParser {
  constructor() {
    super();
    this.regexUtils = new RegexUtils();
    this.numberUtils = new NumberUtils();
  }

  getStoreName() {
    return "Costco";
  }

  canParse(text) {
    return text.includes("Costco");
  }

  parse(text) {
    const lines = text.split('\n');
    const transactions = [];
    let parsingMetadata = false;
    let date, total, cardLastFour, storeInfo;

    lines.forEach(line => {
      if (line.includes("**** TOTAL")) {
        total = this.#formatAmount(this.#find(line, "**** TOTAL"));
        parsingMetadata = true;
        return;
      }

      if (parsingMetadata) {
        const dateRegex = `(${ this.regexUtils.date() }) ${ this.regexUtils.anything() }`;
        const foundDate = this.regexUtils.matchAll(line, dateRegex);
        if (foundDate.length) {
          date = foundDate[1];
        }

        if (this.#find(line, "XXXXXXXXXXXXX")) {
          cardLastFour = line.replace(/[A-Za-z]/g, "").slice(-4);
        }
        return;
      }

      const transaction = this.#parseTransaction(line);
      if (transaction) {
        transactions.push(transaction);
      }
    });

    const storeLines = lines.slice(0, 3);
    const splitCityStateZipOnComma = storeLines[2].split(",");
    storeInfo = {
      name: storeLines[0],
      address: `${storeLines[1]}, ${splitCityStateZipOnComma[0]}, ${splitCityStateZipOnComma[1].slice(0, 2)} ${splitCityStateZipOnComma[1].slice(-5)}`,
    };

    return {
      transactions,
      date,
      total,
      cardLastFour,
      storeInfo,
    };
  }

  #parseTransaction(line) {
    const transactionRegex = `([A-Z]?[0-9]+)(${ this.regexUtils.nonGreedyAnything() })${ this.regexUtils.dollar() }`;
    const foundTransaction = this.regexUtils.matchAll(line, transactionRegex);
    if (foundTransaction.length) {
      const amount = this.#formatAmount(foundTransaction[3]);
      const itemName = foundTransaction[2].trim();
      const itemIdentifier = foundTransaction[1].replace(/[A-Z]/g, "").trim();
      const isTaxable = this.#isTaxable(foundTransaction[1]);

      return { itemIdentifier, itemName, amount, isTaxable };
    }
    return null;
  }

  #isTaxable(itemIdentifier) {
    const taxCode = itemIdentifier.charAt(0);
    return !["E", "F"].includes(taxCode);
  }

  #formatAmount(amount) {
    if (amount.slice(-1) === "-") {
      return this.numberUtils.dollarToNumber(amount.slice(0, -1), true);
    }
    return this.numberUtils.dollarToNumber(amount);
  }

  #find(line, str) {
    const index = line.indexOf(str);
    if (index > -1) {
      return line.substring(index + str.length);
    }
    return undefined;
  }
}

module.exports = CostcoReceiptParser;
