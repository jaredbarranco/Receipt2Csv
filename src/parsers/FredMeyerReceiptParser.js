const ReceiptParser = require('../ReceiptParser');
const { NumberUtils } = require('../NumberUtils');

class FredMeyerReceiptParser extends ReceiptParser {
  constructor() {
    super();
    this.numberUtils = new NumberUtils();
  }

  getStoreName() {
    return "Fred Meyer";
  }

  canParse(text) {
    return text.includes("Fred Meyer");
  }

  parse(text) {
    const lines = text.split('\n');
    let transactions = [];
    let date, total, cardLastFour, storeInfo;
    let isParsingItems = false;

    let currentItem = {};

    for (const line of lines) {
      if (line.includes("Item Details")) {
        isParsingItems = true;
        continue;
      }

      if (line.includes("Other Fees")) {
        isParsingItems = false;
        continue;
      }

      if (isParsingItems) {
        const priceMatch = line.match(/(.*) \$(\d+\.\d{2})$/);
        if (priceMatch) {
          currentItem.itemName = priceMatch[1].trim();
          currentItem.amount = this.numberUtils.dollarToNumber(priceMatch[2]);
        }

        const upcMatch = line.match(/UPC: (\d+)/);
        if (upcMatch) {
          currentItem.itemIdentifier = upcMatch[1];
          // Assuming taxable by default, can be refined if receipt has tax info per item
          currentItem.isTaxable = true; 
          transactions.push(currentItem);
          currentItem = {};
        }
      }

      const dateMatch = line.match(/Order Date: (.*)/);
      if (dateMatch) {
        date = new Date(dateMatch[1]).toISOString().split('T')[0];
      }

      const totalMatch = line.match(/Order Total \$(\d+\.\d{2})/);
      if (totalMatch) {
        total = this.numberUtils.dollarToNumber(totalMatch[1]);
      }

      const cardMatch = line.match(/VISA (\d{4}) \$/);
      if (cardMatch) {
        cardLastFour = cardMatch[1];
      }
    }

    storeInfo = {
      name: "Fred Meyer",
      address: lines.find(line => line.includes("St"))?.trim(),
    };

    return {
      transactions,
      date,
      total,
      cardLastFour,
      storeInfo,
    };
  }
}

module.exports = FredMeyerReceiptParser;
