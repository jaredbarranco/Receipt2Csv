# Receipt2Csv

A script to parse your receipts from various stores (PDFs) and create a CSV with all the items you bought.

## How to use

1. Download your PDF receipts from your store's website.
2. Place them in a directory.
3. Make sure you have Node v18 or higher installed.
4. Run `npm install` to install the necessary dependencies.
5. Run `node index.js <path_to_your_receipts_directory>`. For example, `node index.js ./my-receipts`.
6. The script will generate CSV files in the `out/` directory, one for each store.

## How it works

`index.js` is the entry point. It scans the specified directory for PDF files and then tries to find a suitable parser for each PDF.

The parsers are located in the `src/parsers` directory. Each parser is a class that extends the base `ReceiptParser` and is responsible for parsing the text from a specific store's receipt.

The application uses a plugin-based architecture, so you can easily add support for new stores without modifying the core application logic.

## Adding a New Store Parser

To add support for a new store, you need to create a new parser class.

1.  Create a new file in the `src/parsers` directory, for example, `MyStoreReceiptParser.js`.
2.  In this file, define a class that extends `ReceiptParser`.
3.  Implement the following methods in your class:

    *   `getStoreName()`: Return the name of the store (e.g., "My Store").
    *   `canParse(text)`: This method receives the full text of a receipt. It should return `true` if your parser can handle this text, and `false` otherwise. A simple way to do this is to check for the store's name in the text.
    *   `parse(text)`: This is the main parsing method. It receives the full text of the receipt and should return an object with the extracted data.

### Parser Template

Here is a basic template for a new parser:

```javascript
const ReceiptParser = require('../ReceiptParser');

class MyStoreReceiptParser extends ReceiptParser {
  getStoreName() {
    return "My Store";
  }

  canParse(text) {
    // Check for a unique string that identifies the store's receipts
    return text.includes("My Store");
  }

  parse(text) {
    // Implement your parsing logic here
    const transactions = []; // Array of transaction objects
    let date, total, cardLastFour, storeInfo;

    // Your logic to extract data from the 'text' variable
    // and populate the variables above.

    return {
      transactions,
      date,
      total,
      cardLastFour,
      storeInfo,
    };
  }
}

module.exports = MyStoreReceiptParser;
```

Once you've created your parser, it will be automatically discovered and used by the application.

## Contributors

Thanks to [Neville](https://github.com/nevillev) for changing the PDF parsing library to pdfdataextract, which handles spaces better than pdf-parse. ([commit](https://github.com/GonzaloZiadi/CostcoWrapped/commit/c56a8cfdd20c4af13c42a512d4a4c22f002518a3))
