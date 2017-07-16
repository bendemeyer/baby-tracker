var feedingTableRow = '<tr><td>{{date}}</td><td>{{time}}</td><td>{{amount}}</td><td>{{notes}}</td></tr>';
var diaperTableRow = '<tr><td>{{date}}</td><td>{{time}}</td><td>{{notes}}</td></tr>';

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
}

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

function getRows(data, templateString) {
    var rowsHTML = '';
    var template = Handlebars.compile(templateString);
    for (var i = 0; i < data.length; i++) {
        var dateObject = buildDateFromString(data[i].date);
        dateString = ''
        dateString += dayMap[dateObject.getDay()] + ', ';
        dateString += monthMap[dateObject.getMonth()] + ' ';
        dateString += dateObject.getDate();
        data[i].date = dateString;
        rowsHTML += template(data[i]);
    }
    return rowsHTML;
};

function getFeedingRows(feedingData) {
    return getRows(feedingData, feedingTableRow);
};

function getDiaperRows(diaperData) {
    return getRows(diaperData, diaperTableRow);
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

    function displayActiveTable() {
        $('#main > div').hide();
        var tableId = $('#nav a.active').data('table-id');
        $('#' + tableId).show();
    };

    $(document).ready(function () {
        prepareDates($('#dates'));

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
        
        prepareFeedingData(getFeedings(formatDateStringForURL($('#from-date').val()), formatDateStringForURL($('#to-date').val()))).then(function () {
            $('#feeding-table tbody').html(getFeedingRows(feedingData));
        });

        prepareDiaperData(getDiapers(formatDateStringForURL($('#from-date').val()), formatDateStringForURL($('#to-date').val()))).then(function () {
            $('#diaper-table tbody').html(getDiaperRows(diaperData));
        });

        displayActiveTable();

        $('#nav a').click(function (e) {
            e.preventDefault();
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