from flask import Flask, request, Response
from collections import OrderedDict
import MySQLdb
import MySQLdb.cursors
import json
import config
import datetime
import decimal


app = Flask("Baby Tracker")

@app.route("/api/feedings/<from_date>/", methods=["GET", "POST"])
@app.route("/api/feedings/<from_date>/<to_date>/", methods=["GET", "POST"])
def feedings(from_date, to_date=None):
    to_date = to_date or from_date
    dbconn = get_db_connection()
    if (request.method == "POST"):
        params = request.get_json()
        sql = "INSERT INTO feedings (date, time, amount, notes) VALUES (%(date)s, %(time)s, %(amount)s, %(notes)s);"
        cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute(sql, {
            'date': from_date,
            'time': params['time'],
            'amount': params['amount'],
            'notes': params['notes']
        })
        dbconn.commit()
    sql = "SELECT date, time, amount, notes from feedings where date >= %(from_date)s and date <= %(to_date)s order by date desc, time asc;"
    cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute(sql, {
        'from_date': from_date,
        'to_date': to_date
    })
    rows = list(cursor.fetchall())
    dbconn.close()
    return Response(json.dumps(group_and_sanitize_rows(rows)), mimetype='application/json')


@app.route("/api/diapers/<from_date>/", methods=["GET", "POST"])
@app.route("/api/diapers/<from_date>/<to_date>/", methods=["GET", "POST"])
def diapers(from_date, to_date=None):
    to_date = to_date or from_date
    dbconn = get_db_connection()
    if (request.method == "POST"):
        params = request.get_json()
        sql = "INSERT INTO diapers (date, time, poop, notes) VALUES (%(date)s, %(time)s, %(poop)s, %(notes)s);"
        cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute(sql, {
            'date': from_date,
            'time': params['time'],
            'poop': params['poop'],
            'notes': params['notes']
        })
        dbconn.commit()
    sql = "SELECT date, time, poop, notes from diapers where date >= %(from_date)s and date <= %(to_date)s order by date desc, time asc;"
    cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute(sql, {
        'from_date': from_date,
        'to_date': to_date
    })
    rows = list(cursor.fetchall())
    dbconn.close()
    return Response(json.dumps(group_and_sanitize_rows(rows)), mimetype='application/json')


def group_and_sanitize_rows(rows):
    for row in rows[:]:
        for k, v in row.items():
            if isinstance(v, datetime.date) or isinstance(v, datetime.timedelta) or isinstance(v, decimal.Decimal):
                row[k] = str(v)
    grouped_rows = OrderedDict()
    for row in rows:
        date = row['date']
        row.pop('date')
        if date not in grouped_rows:
            grouped_rows[date] = []
        grouped_rows[date].append(row)
    return grouped_rows


def get_db_connection():
    return MySQLdb.connect(
            host= config.db['host'],
            user=config.db['user'],
            passwd=config.db['pass'],
            db=config.db['db_name'],
            port=config.db['port'])


if __name__ == '__main__':
	app.run(host='0.0.0.0')
