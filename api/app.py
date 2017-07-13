from flask import flask


app = Flask("Baby Tracker")

@app.route("/api/feedings/<from_date>/", methods=["GET", "POST"])
@app.route("/api/feedings/<from_date>/<to_date>/", methods=["GET", "POST"])
def feedings(from_date, to_date=None):
    to_date = to_date or from_date
    if (request.method == "POST"):
        # check post data for time, ounces, and notes and add a feeding to the DB
        pass
    # select all feedings between <from> and <to> and return them
    pass


@app.route("/api/diapers/<from_date>/", methods=["GET", "POST"])
@app.route("/api/diapers/<from_date>/<to_date>/", methods=["GET", "POST"])
def diapers(from_date, to_date=None):
    to_date = to_date or from_date
    if (request.method == "POST"):
        # check post data for time and notes and add a diaper to the DB
        pass
    # select all diapers between <from> and <to> and return them
    pass