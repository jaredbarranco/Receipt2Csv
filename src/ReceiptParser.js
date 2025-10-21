class ReceiptParser {
  getStoreName() {
    throw new Error('getStoreName() must be implemented by subclasses');
  }

  canParse(text) {
    throw new Error('canParse(text) must be implemented by subclasses');
  }

  parse(text) {
    throw new Error('parse(text) must be implemented by subclasses');
  }
}

module.exports = ReceiptParser;
