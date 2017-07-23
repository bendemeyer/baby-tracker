var feedingTemplate = {
    'table': '<div class="date-table"><h3>{{date}}</h3><table><thead><tr><th>Time</th><th>Amount</th><th>Notes</th></thead><tbody>{{{rows}}}<tr><th>Total:</th><th>{{total}}</th><th></th></tr></tbody></table></div>',
    'rows': '<tr><td>{{{time}}}</td><td>{{amount}}</td><td>{{notes}}</td></tr>'
};

var diaperTemplate = {
    'table': '<div class="date-table"><h3>{{date}}</h3><table><thead><tr><th>Time</th><th>Poop?</th><th>Notes</th></thead><tbody>{{{rows}}}</tbody></table></div>',
    'rows': '<tr><td>{{{time}}}</td><td>{{poop}}</td><td>{{notes}}</td></tr>'
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

function formatTimeStringForPost(timeString) {
    var timeSplit = timeString.split(' ');
    var timeArray = timeSplit[0].split(':');
    if (timeSplit[1] == 'PM' && timeArray[0] != 12) {
        timeArray[0] = parseInt(timeArray[0]) + 12;
    }
    else if (timeSplit[1] == 'AM' && timeArray[0] == 12) {
        timeArray[0] = 0;
    }
    timeArray.push('00');
    return timeArray.join(':');
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

function postDiaper(date, time, poop, notes) {
    return jQuery.ajax({
        url: '/api/diapers/' + date + '/',
        contentType: "application/json",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            time: time,
            poop: poop,
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
        var totalAmount = 0;
        var date = dates[i]
        var rowsHTML = '';
        for (var j = 0; j < data[date].length; j++) {
            if (data[date][j].amount) {
                totalAmount += parseFloat(data[date][j].amount);
                data[date][j].amount = data[date][j].amount + ' oz';
            }
            var time = data[date][j].time;
            var timeArray = time.split(':');
            timeArray.pop();
            if (timeArray[0] >= 12) {
                if (timeArray[0] > 12) {
                    timeArray[0] = timeArray[0] - 12;
                }
                timeArray[1] += '&nbsp;PM';
            }
            else {
                if (timeArray[0] == 0) {
                    timeArray[0] = 12;
                }
                timeArray[1] += '&nbsp;AM';
            }
            data[date][j].time = timeArray.join(':');
            rowsHTML += rowTemplate(data[date][j]);
        }
        var dateObject = buildDateFromString(date);
        dateString = ''
        dateString += dayMap[dateObject.getDay()] + ', ';
        dateString += monthMap[dateObject.getMonth()] + ' ';
        dateString += dateObject.getDate();
        var templateData = {
            date: dateString,
            rows: rowsHTML
        }
        if (totalAmount) {
            templateData['total'] = totalAmount + ' oz';
        }
        tablesHTML += tableTemplate(templateData);
    }
    return tablesHTML;
};

function getFeedingTables(feedingData) {
    return getTables(feedingData, feedingTemplate);
};

function getDiaperTables(diaperData) {
    for (key in diaperData) {
        for (var i = 0; i < diaperData[key].length; i++) {
            if (diaperData[key][i]['poop']) {
                diaperData[key][i]['poop'] = 'Yes';
            }
            else {
                diaperData[key][i]['poop'] = 'No';
            }
        }
    }
    return getTables(diaperData, diaperTemplate);
};

function prepareForm(jQueryForm) {
    var thirtyMinutesAgo = new Date((new Date()).getTime() - (1000 * 60 * 30));
    jQueryForm.find('.form-date').datepicker('destroy').datepicker().datepicker('setDate', thirtyMinutesAgo);
    jQueryForm.find('.form-time').clockpicker({twelvehour: true, donetext: "Done", default: 'now', fromnow: -(1000 * 60 * 30), align: 'right'});
    jQueryForm.find('.form-amount').val('');
    jQueryForm.find('.form-notes').val('');
};

function prepareDates(jQueryContainer) {
    var today = new Date();
    var yesterday = new Date().setDate(today.getDate() - 1);
    jQueryContainer.find("#from-date").datepicker('destroy').datepicker().datepicker('setDate', new Date(yesterday));
    jQueryContainer.find("#to-date").datepicker('destroy').datepicker().datepicker('setDate', today);
}

(function ($) {
    var feedingData = [];
    var diaperData = [];

    function prepareFeedingData(jxhr) {
        return new Promise(function (resolve, reject) {
            jxhr.done(function (data) {
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
            var time = formatTimeStringForPost($(this).find('#feeding-time').val());
            var amount = $(this).find('#feeding-amount').val();
            var notes = $(this).find('#feeding-notes').val();
            prepareFeedingData(postFeeding(date, time, amount, notes)).then(function () {
                var dateArray = date.split('-');
                dateArray.push(dateArray.shift());
                $("#to-date").datepicker('setDate', dateArray.join('/'));
                $("#from-date").datepicker('setDate', dateArray.join('/'));
                $('#feeding-table .table').html(getFeedingTables(feedingData));
                $('#forms-overlay').hide();
                $('#forms form').hide();
                $('#nav #feedings-link').click();
            });
        });

        $('#diaper-form').submit(function (e) {
            e.preventDefault();
            var date = formatDateStringForURL($(this).find('#diaper-date').val());
            var time = formatTimeStringForPost($(this).find('#diaper-time').val());
            var poop = $(this).find('#diaper-poop').get(0).checked;
            var notes = $(this).find('#diaper-notes').val();
            prepareDiaperData(postDiaper(date, time, poop, notes)).then(function () {
                var dateArray = date.split('-');
                dateArray.push(dateArray.shift());
                $("#to-date").datepicker('setDate', dateArray.join('/'));
                $("#from-date").datepicker('setDate', dateArray.join('/'));
                $('#diaper-table .table').html(getDiaperTables(diaperData));
                $('#forms-overlay').hide();
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
            $('#forms-overlay').show();
            $('#' + formId).show();
        });

        $('#forms-overlay').click(function () {
            $('#forms form').hide();
            $(this).hide();
        });

        $('#dates-button').click(function (e) {
            e.preventDefault();
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                $('#dates').slideUp(400, function () {
                    $('#dates-button .fa-times').hide();
                    $('#dates-button .fa-calendar').show();
                });
            }
            else {
                $(this).addClass('active');
                $('#dates').slideDown(400, function () {
                    $('#dates-button .fa-calendar').hide();
                    $('#dates-button .fa-times').show();
                });
            }
        });
    });
})(jQuery);