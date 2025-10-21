# Plan to Support Pluggable Receipt Parsers

This document outlines a plan to refactor the receipt processing application to support parsing receipts from different stores through a plugin-based architecture.

## 1. Introduction

The current implementation is tightly coupled to Costco receipts. The goal is to create a system where third-party developers can easily add support for new stores without modifying the core application. This will be achieved by defining a clear interface for receipt parsers and dynamically loading them at runtime.

## 2. Proposed Architecture

The new architecture will consist of the following components:

*   **Parser Interface:** A defined contract that all store-specific parsers must adhere to.
*   **Plugin Discovery:** A mechanism to find and load available parser plugins.
*   **Core Application:** The main application logic that orchestrates the process of reading PDFs, identifying the correct parser, and writing the output.

## 3. Parser Interface

A new base class or interface, `ReceiptParser`, will be defined. All store-specific parsers will extend this class. The interface will include the following methods and properties:

*   `getStoreName()`: Returns the name of the store (e.g., "Costco", "Fred Meyer").
*   `canParse(text)`: A method that takes the text content of a PDF page as input and returns `true` if the parser can handle it, `false` otherwise. This will be used to identify the correct parser for a given receipt.
*   `parse(text)`: The main parsing method. It takes the full text of the receipt and returns an object containing the extracted data (transactions, date, total, etc.).
*   The `parse` method will return an object with a defined structure, for example:
    ```javascript
    {
      transactions: [
        {
          itemIdentifier: "12345",
          itemName: "Organic Milk",
          amount: 3.99,
          isTaxable: true
        }
      ],
      date: "2025-10-20",
      total: 123.45,
      cardLastFour: "1234",
      storeInfo: {
        name: "Costco #123",
        address: "123 Main St"
      }
    }
    ```

## 4. Plugin Discovery

Parsers will be located in a dedicated `src/parsers` directory. The main application will scan this directory at startup to discover all available parser plugins. Each file in this directory will be expected to export a class that implements the `ReceiptParser` interface.

## 5. Core Application Refactoring

`index.js` will be modified to:

1.  Load all parser plugins from the `src/parsers` directory.
2.  For each PDF in the input source, iterate through the loaded parsers. The source can be a directory containing receipts from multiple vendors.
3.  Use the `canParse()` method of each parser to determine which one can handle the receipt.
4.  Once the correct parser is found, use its `parse()` method to extract the data.
5.  The extracted data will then be passed to the `CsvWriter` as is currently done.

## 6. Input Handling

To make the tool more flexible, the input mechanism will be updated:

*   The application will accept a command-line argument specifying the path to an input file or directory.
*   If the path is a directory, the application will process all PDF files within it. The directory can contain receipts from multiple vendors.
*   If the path is a single file, the application will process only that file.
*   If no path is provided, the application can default to a predefined directory (e.g., `./receipts`) for ease of use.

This change decouples the application from a hardcoded input directory and allows for more versatile use cases.

## 7. Refactoring `CostcoReceiptParser.js`

The existing `CostcoReceiptParser.js` will be refactored to conform to the new `ReceiptParser` interface.

1.  It will be moved to `src/parsers/CostcoReceiptParser.js`.
2.  It will implement the `canParse(text)` method, likely by looking for the "Costco" string in the text.
3.  The `parseLine` method will be adapted into the `parse(text)` method, which will process the entire receipt text.

## 8. Implementation Steps

1.  Create a new directory `src/parsers`.
2.  Define the `ReceiptParser` base class/interface in a new file `src/ReceiptParser.js`.
3.  Move and refactor `CostcoReceiptParser.js` to `src/parsers/CostcoReceiptParser.js` to implement the new interface.
4.  Update `index.js` to handle command-line arguments for input paths and to implement the plugin discovery and parsing logic.
5.  Create a new parser for another store (e.g., "Fred Meyer") as a proof of concept.
6.  Update documentation to explain how to create and add new parsers.

This plan will result in a more modular and extensible application, making it easy to add support for new stores in the future.
