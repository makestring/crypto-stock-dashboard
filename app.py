from flask import Flask, render_template, jsonify, request, session
import yfinance as yf

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Required for session management

# Predefined assets
CRYPTO_ASSETS = ["BTC-USD", "ETH-USD", "XRP-USD", "SOL-USD", "ADA-USD", "AVAX-USD", "DOT-USD", "UNI-USD"]
BRAZIL_STOCKS = ["PRIO3.SA", "BBAS3.SA", "VLID3.SA", "BRAV3.SA", "BPAC3.SA", "INBR32.SA"]
USA_STOCKS = ["ASML", "META", "TSM", "CROX"]

# Initialize session data
@app.before_request
def initialize_session():
    if "crypto_assets" not in session:
        session["crypto_assets"] = CRYPTO_ASSETS
    if "brazil_stocks" not in session:
        session["brazil_stocks"] = BRAZIL_STOCKS
    if "usa_stocks" not in session:
        session["usa_stocks"] = USA_STOCKS

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_crypto_data")
def get_crypto_data():
    crypto_data = []
    for symbol in session["crypto_assets"]:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            crypto_data.append({
                "symbol": symbol,
                "price": hist["Close"].iloc[-1],
                "change": (hist["Close"].iloc[-1] - hist["Open"].iloc[-1]) / hist["Open"].iloc[-1] * 100
            })
    return jsonify(crypto_data)

@app.route("/get_stock_data/<market>")
def get_stock_data(market):
    stock_data = []
    symbols = session["brazil_stocks"] if market == "brazil" else session["usa_stocks"]
    for symbol in symbols:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d")
        if not hist.empty:
            stock_data.append({
                "symbol": symbol,
                "price": hist["Close"].iloc[-1],
                "change": (hist["Close"].iloc[-1] - hist["Open"].iloc[-1]) / hist["Open"].iloc[-1] * 100
            })
    return jsonify(stock_data)

@app.route("/add_asset/<market>", methods=["POST"])
def add_asset(market):
    symbol = request.json["symbol"]
    if market == "crypto":
        session["crypto_assets"].append(symbol)
    elif market == "brazil":
        session["brazil_stocks"].append(symbol)
    elif market == "usa":
        session["usa_stocks"].append(symbol)
    session.modified = True
    return jsonify(success=True)

@app.route("/remove_asset/<market>", methods=["POST"])
def remove_asset(market):
    symbol = request.json["symbol"]
    if market == "crypto":
        session["crypto_assets"] = [s for s in session["crypto_assets"] if s != symbol]
    elif market == "brazil":
        session["brazil_stocks"] = [s for s in session["brazil_stocks"] if s != symbol]
    elif market == "usa":
        session["usa_stocks"] = [s for s in session["usa_stocks"] if s != symbol]
    session.modified = True
    return jsonify(success=True)

@app.route("/get_historical_data/<market>/<symbol>")
def get_historical_data(market, symbol):
    timeframe = request.args.get("timeframe", "5y")  # Default to 5 years
    if market == "brazil":
        symbol += ".SA"
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=timeframe)
    return jsonify(hist.to_dict())

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/get_historical_data/<market>/<symbol>")
def get_historical_data(market, symbol):
    timeframe = request.args.get("timeframe", "5y")  # Default to 5 years
    if market == "brazil":
        symbol += ".SA"
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=timeframe)
        if hist.empty:
            return jsonify(error="No data found for this symbol."), 404
        return jsonify(hist.to_dict())
    except Exception as e:
        return jsonify(error=str(e)), 500