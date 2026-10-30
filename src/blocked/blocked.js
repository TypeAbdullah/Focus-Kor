document.addEventListener("DOMContentLoaded", () => {
  const quoteEl = document.getElementById("quoteText");
  const quoteList = (typeof quotes !== "undefined" && Array.isArray(quotes) && quotes.length > 0)
    ? quotes
    : ((window.quotes && Array.isArray(window.quotes) && window.quotes.length > 0)
        ? window.quotes
        : ["Focus kor!"]);

  const chosenQuote = quoteList[Math.floor(Math.random() * quoteList.length)];
  if (quoteEl) {
    quoteEl.textContent = chosenQuote;
  }
});

