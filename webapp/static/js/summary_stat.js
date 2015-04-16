(function() {
    'use strict';
    // json data that we intend to update later on via on-screen controls
    var split_by_data;
    var aspect1_data;
    var aspect2_data;
    var display_data;
    var display2_data;
    var brush;
    var x;

    var torso = {};
    torso.width = 375;
    torso.height =350;
    torso.right = 20;

    assignEventListeners();

    var curDate;
    var subData;

    var dataObj;

    var urls_data;
    var urls_news_data;
    var cur_y_access = 'tweet_num';
    var cur_y_marker = 'pol';

    var marker = 
        [{'date': new Date('2015-02-02T00:00:00.000Z'),'label': 'Superbowl'},
        {'date': new Date('2015-02-04T00:00:00.000Z'),'label': 'Brian Williams'},
        {'date': new Date('2015-02-08T00:00:00.000Z'),'label': 'Grammys'},
        {'date': new Date('2015-02-11T00:00:00.000Z'),'label': 'Jon Stewart'},
        {'date': new Date('2015-02-19T00:00:00.000Z'),'label': 'Aaron Hernandez'},
        {'date': new Date('2015-02-22T00:00:00.000Z'),'label': 'Oscars'},
        {'date': new Date('2015-02-26T00:00:00.000Z'),'label': 'The Dress'},
        {'date': new Date('2015-03-04T00:00:00.000Z'),'label': 'Tsarnaev trial'},
        {'date': new Date('2015-03-07T00:00:00.000Z'),'label': 'Selma'},
        {'date': new Date('2015-03-09T00:00:00.000Z'),'label': 'Apple watch'},
        {'date': new Date('2015-03-18T00:00:00.000Z'),'label': 'Budget 2015'},
        {'date': new Date('2015-03-26T00:00:00.000Z'),'label': 'German Wing'},
        {'date': new Date('2015-03-31T00:00:00.000Z'),'label': 'Iran talk'},
        {'date': new Date('2015-04-02T00:00:00.000Z'),'label': 'Garissa'},
        {'date': new Date('2015-04-06T00:00:00.000Z'),'label': 'NCAA'},
        {'date': new Date('2015-04-08T00:00:00.000Z'),'label': 'Walter Scott'},
        {'date': new Date('2015-04-12T00:00:00.000Z'),'label': 'Hilary Clinton'}

        ];

    d3.json('static/data/febTweets.json', function(data) {
        for(var i = 0; i < data.length; i++) {
            data[i] = MG.convert.date(data[i], 'date');
        }
        aspect1_data = data;

        display_data = MG.data_graphic({
            title:"Summary Timeline for Journalist Tweets",
            description: "Describes summary stats over time for journalist tweets",
            data: data,
            full_width: true,
            height: torso.height * 3 / 2,
            right: torso.right,
            x_extended_ticks: true,
            legend: ['CNN', 'New York Times', 'Fox News', 'Wall Street Journal','Buzzfeed', 'NPR'],
            legend_target: '.legend',
            target: '#aspect1',
            x_accessor: 'date',
            y_accessor: cur_y_access,
            markers:marker,
            mouseover: function(d, i) {
                curDate = d3.time.day(d.date);
            }
        });

    });

    d3.json('static/data/marTweets.json', function(data) {
        for(var i = 0; i < data.length; i++) {
            data[i] = MG.convert.date(data[i], 'date');
        }
        aspect2_data = data;

        display2_data = MG.data_graphic({
            title:"Summary Timeline for Journalist Tweets",
            description: "Describes summary stats over time for journalist tweets",
            data: data,
            full_width: true,
            height: torso.height * 3 / 2,
            right: torso.right,
            x_extended_ticks: true,
            legend: ['CNN', 'New York Times', 'Fox News', 'Wall Street Journal','Buzzfeed', 'NPR'],
            legend_target: '.legend2',
            target: '#aspect2',
            x_accessor: 'date',
            y_accessor: cur_y_access,
            markers:marker,
            mouseover: function(d, i) {
                curDate = d3.time.day(d.date);
            }
        });
        d3.selectAll('text').attr('width','50px');
    });
d3.selectAll('.mg-year-marker text')
    .attr('transform', 'translate(0, 8)');
    function assignEventListeners() {
        $('.aspect1-controls button').click(function() {
            var new_y_accessor = $(this).data('y_accessor');
            console.log(new_y_accessor);

            $(this).addClass('active')
                .siblings()
                .removeClass('active');

            cur_y_access = new_y_accessor;
            // update data
            MG.data_graphic({
                title:"Summary Timeline for Journalist Tweets",
                description: "Describes summary stats over time for journalist tweets",
                data: display_data,
                full_width: true,
                height: torso.height * 3 / 2,
                right: torso.right,
                x_extended_ticks: true,
                target: '#aspect1',
                markers:marker,
                x_accessor: 'date',
                y_accessor: cur_y_access
            });
        });
        $('.aspect2-controls button').click(function() {
            var new_y_accessor = $(this).data('y_accessor');
            console.log(new_y_accessor);

            $(this).addClass('active')
                .siblings()
                .removeClass('active');

            cur_y_access = new_y_accessor;
            // update data
            MG.data_graphic({
                title:"Summary Timeline for Journalist Tweets",
                description: "Describes summary stats over time for journalist tweets",
                data: display2_data,
                full_width: true,
                height: torso.height * 3 / 2,
                right: torso.right,
                x_extended_ticks: true,
                target: '#aspect2',
                markers:marker,
                x_accessor: 'date',
                y_accessor: cur_y_access
            });
        });
    }

    // replace all SVG images with inline SVG
    // http://stackoverflow.com/questions/11978995/how-to-change-color-of-svg
    // -image-using-css-jquery-svg-image-replacement
    $('img.svg').each(function() {
        var $img = jQuery(this);
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgURL = $img.attr('src');

        $.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            var $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if (typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if (typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass + ' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');
    });

    function modify_time_period(data, past_n_days) {
        // splice time period
        var data_spliced = MG.clone(data);
        if (past_n_days !== '') {
            for (var i = 0; i < data_spliced.length; i++) {
                var from = data_spliced[i].length - past_n_days;
                data_spliced[i].splice(0,from);
            }
        }

        return data_spliced;
    }
})();
