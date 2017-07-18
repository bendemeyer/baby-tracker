var feedingTemplate = {
    'table': '<div class="date-table"><h3>{{date}}</h3><table><thead><tr><th>Time</th><th>Amount</th><th>Notes</th></thead><tbody>{{{rows}}}</tbody></table></div>',
    'rows': '<tr><td>{{time}}</td><td>{{amount}}</td><td>{{notes}}</td></tr>'
};

var diaperTemplate = {
    'table': '<div class="date-table"><h3>{{date}}</h3><table><thead><tr><th>Time</th><th>Notes</th></thead><tbody>{{{rows}}}</tbody></table></div>',
    'rows': '<tr><td>{{time}}</td><td>{{notes}}</td></tr>'
};

var dayMap = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

var monthMap = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

function leftPad(num, width) {
    var numString = num.toString();
    while (numString.length < width) {
        numString = '0' + numString;
    }
    return numString;
};

function formatDateFromObject(dateObject) {
    var dateArray = [];
    dateArray.push(dateObject.getFullYear());
    dateArray.push(leftPad(dateObject.getMonth() + 1, 2));
    dateArray.push(leftPad(dateObject.getDate(), 2));
    return dateArray.join('-');
};

function formatDateStringForURL(dateString) {
    var dateArray = dateString.split('/');
    dateArray.unshift(dateArray.pop());
    return dateArray.join('-');
}

function formatTimeFromObject(dateObject) {
    var minutes = dateObject.getMinutes();
    var hour = dateObject.getHours();
    return leftPad(hour, 2) + ":" + leftPad(minutes, 2);
}

function buildDateFromString(formattedDate) {
    var dateArray = formattedDate.split('-');
    var year = parseInt(dateArray.shift());
    var month = parseInt(dateArray.shift()) - 1;
    var date = parseInt(dateArray.shift());
    return new Date(year, month, date);
};

function postFeeding(date, time, amount, notes) {
    return jQuery.ajax({
        url: '/api/feedings/' + date + '/',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            time: time,
            amount: amount,
            notes: notes
        })
    });
};

function postDiaper(date, time, notes) {
    return jQuery.ajax({
        url: '/api/diapers/' + date + '/',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            time: time,
            notes: notes
        })
    });
};

function getFeedings(fromDate, toDate) {
    return jQuery.ajax({
        url: '/api/feedings/' + fromDate + '/' + toDate + '/',
        type: 'GET',
        dataType: 'json'
    });
};

function getDiapers(fromDate, toDate) {
    return jQuery.ajax({
        url: '/api/diapers/' + fromDate + '/' + toDate + '/',
        type: 'GET',
        dataType: 'json'
    });
};

function getTables(data, template) {
    var tablesHTML = ''
    var tableTemplate = Handlebars.compile(template['table']);
    var rowTemplate = Handlebars.compile(template['rows']);
    var dates = Object.keys(data).sort().reverse();
    for (var i = 0; i < dates.length; i++) {
        var date = dates[i]
        var rowsHTML = '';
        for (var j = 0; j < data[date].length; j++) {
            var time = data[date][j].time;
            var timeArray = time.split(':');
            timeArray.pop();
            if (timeArray[0] > 12) {
                timeArray[0] = timeArray[0] - 12;
                timeArray[1] += ' PM';
            }
            else if (timeArray[0] == 0) {
                timeArray[0] = 12;
                timeArray[1] += ' AM';
            }
            else {
                timeArray[1] += ' AM';
            }
            data[date][j].time = timeArray.join(':');
            rowsHTML += rowTemplate(data[date][j]);
        }
        var dateObject = buildDateFromString(date);
        dateString = ''
        dateString += dayMap[dateObject.getDay()] + ', ';
        dateString += monthMap[dateObject.getMonth()] + ' ';
        dateString += dateObject.getDate();
        tablesHTML += tableTemplate({date: dateString, rows: rowsHTML});
    }
    return tablesHTML;
};

function getFeedingTables(feedingData) {
    return getTables(feedingData, feedingTemplate);
};

function getDiaperTables(diaperData) {
    return getTables(diaperData, diaperTemplate);
};

function prepareForm(jQueryForm) {
    var thirtyMinutesAgo = new Date((new Date()).getTime() - (1000 * 60 * 30));
    jQueryForm.find('.form-date').datepicker('destroy').datepicker().datepicker('setDate', thirtyMinutesAgo);
    jQueryForm.find('.form-time').clockpicker({twelvehour: true, donetext: "Done", default: thirtyMinutesAgo});
    jQueryForm.find('.form-amount').val('');
    jQueryForm.find('.form-notes').val('');
};

function prepareDates(jQueryContainer) {
    jQueryContainer.find(".date-selector").datepicker('destroy').datepicker().datepicker('setDate', new Date());
}

(function ($) {
    var feedingData = [];
    var diaperData = [];

    function prepareFeedingData(jxhr) {
        return new Promise(function (resolve, reject) {
            jxhr.done(function (data) {
                console.log(data);
                feedingData = data;
                resolve();
            }).fail(function () {
                reject();
            });
        });
    };

    function prepareDiaperData(jxhr) {
        return new Promise(function (resolve, reject) {
            jxhr.done(function (data) {
                diaperData = data;
                resolve();
            }).fail(function () {
                reject()
            });
        });
    };

    function prepareTableData() {
        prepareFeedingData(getFeedings(formatDateStringForURL($('#from-date').val()), formatDateStringForURL($('#to-date').val()))).then(function () {
            $('#feeding-table .table').html(getFeedingTables(feedingData));
        });

        prepareDiaperData(getDiapers(formatDateStringForURL($('#from-date').val()), formatDateStringForURL($('#to-date').val()))).then(function () {
            $('#diaper-table .table').html(getDiaperTables(diaperData));
        });
    };

    function displayActiveTable() {
        $('#main > div').hide();
        var tableId = $('#nav a.active').data('table-id');
        $('#' + tableId).show();
    };

    $(document).ready(function () {
        prepareDates($('#dates'));

        $('#dates input').change(function (e) {
            prepareTableData();
        });

        $('#forms form').each(function () {
            prepareForm($(this));
        });

        $('#feeding-form').submit(function (e) {
            e.preventDefault();
            var date = formatDateStringForURL($(this).find('#feeding-date').val());
            var time = $(this).find('#feeding-time').val();
            var amount = $(this).find('#feeding-amount').val();
            var notes = $(this).find('#feeding-notes').val();
            prepareFeedingData(postFeeding(date, time, amount, notes)).then(function () {
                $('#feeding-table tbody').html(getFeedingRows(feedingData));
                $('#forms form').hide();
                $('#nav #feedings-link').click();
            });
        });

        $('#diaper-form').submit(function (e) {
            e.preventDefault();
            var date = formatDateStringForURL($(this).find('#diaper-date').val());
            var time = $(this).find('#diaper-time').val();
            var notes = $(this).find('#diaper-notes').val();
            prepareFeedingData(postDiaper(date, time, notes)).then(function () {
                $('#feeding-table tbody').html(getDiaperRows(diaperData));
                $('#forms form').hide();
                $('#nav #diapers-link').click();
            });
        });
        
        prepareTableData();

        displayActiveTable();

        $('#nav a').click(function (e) {
            e.preventDefault();
            $('#forms form').hide();
            $('#nav a').removeClass('active');
            $(this).addClass('active');
            displayActiveTable();
        });

        $('#show-form').click(function (e) {
            e.preventDefault();
            $('#forms form').hide();
            var formId = $('#nav a.active').data('form-id');
            $('#' + formId).show();
        });
    });
})(jQuery);