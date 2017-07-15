from flask import Flask, request
import MySQLdb
import MySQLdb.cursors
import json
import config


app = Flask("Baby Tracker")

@app.route("/api/feedings/<from_date>/", methods=["GET", "POST"])
@app.route("/api/feedings/<from_date>/<to_date>/", methods=["GET", "POST"])
def feedings(from_date, to_date=None):
    to_date = to_date or from_date
    dbconn = getDBConnection()
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
    sql = "SELECT date, time, amount, notes from feedings where date >= %(from_date)s and date <= %(to_date)s;"
    cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute(sql, {
        'from_date': from_date,
        'to_date': to_date
    })
    rows = list(cursor.fetchall())
    for row in rows[:]:
        for k, v in row.items():
            row[k] = str(v)
    dbconn.close()
    return json.dumps(rows)


@app.route("/api/diapers/<from_date>/", methods=["GET", "POST"])
@app.route("/api/diapers/<from_date>/<to_date>/", methods=["GET", "POST"])
def diapers(from_date, to_date=None):
    to_date = to_date or from_date
    dbconn = getDBConnection()
    if (request.method == "POST"):
        params = request.get_json()
        sql = "INSERT INTO diapers (date, time, notes) VALUES (%(date)s, %(time)s, %(notes)s);"
        cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute(sql, {
            'date': from_date,
            'time': params['time'],
            'notes': params['notes']
        })
        dbconn.commit()
    sql = "SELECT date, time, notes from diapers where date >= %(from_date)s and date <= %(to_date)s;"
    cursor = dbconn.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute(sql, {
        'from_date': from_date,
        'to_date': to_date
    })
    rows = cursor.fetchall()
    dbconn.close()
    return json.dumps(rows)


def getDBConnection():
    return MySQLdb.connect(
            host= config.db['host'],
            user=config.db['user'],
            passwd=config.db['pass'],
            db=config.db['db_name'],
            port=config.db['port'])


if __name__ == '__main__':
	app.run(host='0.0.0.0')
