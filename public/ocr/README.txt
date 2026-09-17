These files are the text recogniser the trade journal uses to read the prices
printed on a chart screenshot.

They are served from this site on purpose. The library that uses them fetches
them from a public CDN by default, which would mean a third party seeing a
visitor's address the moment they opened the journal. The site tells people
their screenshot never leaves their computer, so the recogniser it needs should
not phone anyone either.

Only the LSTM builds are kept, because that is the only engine used. Regenerate
with: cp node_modules/tesseract.js-core/*-lstm.wasm* public/ocr/
      cp node_modules/tesseract.js/dist/worker.min.js public/ocr/
Language data: @tesseract.js-data/eng -> public/ocr/lang/eng.traineddata.gz
