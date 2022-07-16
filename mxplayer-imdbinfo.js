// ==UserScript==
// @name         IMDb Info On MXplayer
// @description  Detailed IMDB info to Mxplayer titles
// @namespace    http://tampermonkey.net/
// @version      1.2
// @author       MrCoderAbhi
// @match        https://www.mxplayer.in/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    $('head').append(`<style>
                a.slnk {margin-left: 10px; margin-top:5px;}
                a.slnk img {width: 25px; height: 25px;}
                </style>`);

    //Check if clicked the title
    var waitUp = false;
    //main loop
   var refreshId = setInterval(function() {

        if($('div.PlayerControlsNeo__button-control-row').length){
            //video is playing so stop the script
            clearInterval(refreshId);
        }
        else if(document.getElementsByClassName("bd-detail-title h1-heading ").length && !waitUp){
            //clicked on title details so load the imdb score
            loadImdbScore();
         waitUp = true;

        }
        else if(document.getElementsByClassName("bd-detail-title h1-heading ").length == 0) //title details is closed so don't try to load imdb score again by changing waitUp
            waitUp = false;
    }, 1000);
//<div class="header-title">The Eken</div>
    function loadImdbScore() {
        var a = document.getElementsByClassName("bd-detail-title h1-heading ");
        //document.querySelector('#root > div > div > div.modules.undefined > div:nth-child(3) > div > div.header > div > div > span.header-details > span:nth-child(2)').outerText
        var x = document.querySelector("#main > div > div.bd-header > div.bd-content-section > div > div.bd-main-details.inline-top > div.meta-info-container > div:nth-child(1) > div:nth-child(3) > a");
       // console.log("work");
      //  if(a.length > 0 && x.length > 0){
           // console.log("work2");
            var title = a[0].textContent;
            var yearArray = x.outerText;
            var year = yearArray;
            /*var seasonArray = yearArray[2].split("Season");
            var season;
            if(seasonArray.length > 1)
                season = parseInt(seasonArray[0].trim());
            if(season)
                year = year - season + 1;*/
            console.log(title);
            console.log(yearArray);
            var z;
            main();
            async function main() {
                $('<img>').attr('src', "https://i.imgur.com/1Aatim3.gif").attr('width', 20).attr('id', "imdbInfoLoading")
                    .appendTo('#main > div > div.bd-header > div.bd-content-section > div > div.bd-main-details.inline-top > div.meta-info-container > div:nth-child(1)');
                z = await getImdbInfoFromTitle(title, year);
                console.log(z);
                document.getElementById("imdbInfoLoading").remove();
                var color;
                if(z.rating < 6)
                    color = "orangered";
                else if(z.rating >= 6 && z.rating < 7.0)
                    color = "gold";
                else if (z.rating >= 7)
                    color = "lime";
                var imdb = 'https://www.imdb.com/title/' + z.id;
                console.log(imdb);
                $('<a>').attr('href', imdb).attr('target', '_blank').addClass('info-one-line')
                    .html('IMDB: <a class="filter-url-color" ')
                    .appendTo('#main > div > div.bd-header > div.bd-content-section > div > div.bd-main-details.inline-top > div.meta-info-container > div:nth-child(1)');
                $('<b>').attr('span', imdb).attr("style","line-height:25px; margin-left: 5px; color:" + color).html(z.rating)
                    .appendTo('#main > div > div.bd-header > div.bd-content-section > div > div.bd-main-details.inline-top > div.meta-info-container > div:nth-child(1)');
                //if(z.yourRating !== ""){
                  //  $('<img src="https://i.imgur.com/vc5GCnu.png" title="Rated">').attr("style","width: 25px; height: 25px; margin-left: 5px;")
                   // .appendTo('.videoMetadata--container:first');}

            }
      //  }
    }

    //IMDB LIBRARY MODIFIED
    function getImdbIdFromTitle(title, year) {
            var t = title.replace(/\(.*?\)/g,'');


        console.log("t="+t);
        return new Promise(function(resolve, reject) {
            GM_xmlhttpRequest({
                method: 'GET',
                responseType: 'document',
                synchronous: false,
                url: 'https://www.imdb.com/find?s=tt&q=' + t,
                onload: (resp) => {
                    const doc = document.implementation.createHTMLDocument().documentElement;
                    doc.innerHTML = resp.responseText;
                    let links = Array.from(doc.querySelectorAll('.result_text > a'));

                    // Filter out TV episodes, shorts, and video games
                    links = links.filter((el) => !el.parentNode.textContent.trim().match(/\((?:TV Episode|Short|Video Game|Video)\)/));
                    console.log(links);
                    //links = links.filter((el) => el.outerText == title); //aggressive imdb search filter for the titles that are not exactly same as the netflix title
                    let a = links[0];

                    //Sort for year

                    if (year) {
                        console.log('year', year);
                        let sorted = links.map((el) => {
                            let m = el.parentNode.textContent.match(/\((\d{4})\)/);
                            let year = new Date().getFullYear();
                            if (m) {
                                year = parseInt(m[1]);
                            }
                            return { el: el, year: year };
                        });
                        sorted = sorted.sort((a, b) => Math.abs(year - a.year) - Math.abs(year - b.year));
                        a = sorted[0].el;
                    }


                    let id = a && a.href.match(/title\/(tt\d+)/)[1];
                    if (id) {
                        resolve(id);
                    } else {
                        reject(`Error getting IMDb id for ${title} ${year}`);
                    }
                }
            });
        });
    }


    function getImdbInfoFromId(id) {
        return new Promise(function(resolve, reject) {
            GM_xmlhttpRequest({
                method: 'GET',
                responseType: 'document',
                synchronous: false,
                url: `https://www.imdb.com/title/${id}/`,
                onload: (resp) => {
                    const doc = document.implementation.createHTMLDocument().documentElement;
                    doc.innerHTML = resp.responseText;
                    const parse = function(query, regex) {
                        try {
                            let el = doc.querySelector(query);
                            let text = (el.textContent || el.content).trim();
                            if (regex) {
                                text = text.match(regex)[1];
                            }
                            return text.trim();
                        } catch (e) {
                            console.log('error', id);
                            return '';
                        }
                    };

                    let data = {
                        id: id,
                        title: parse('head meta[property="og:title"], .title_wrapper > h1', /([^()]+)/),
                        year: parse('head meta[property="og:title"], .title_wrapper > h1', /\((?:TV\s+(?:Series|Mini-Series|Episode|Movie)\s*)?(\d{4})/),
                     //   description: parse('.plot_summary > .summary_text').replace(/\s+See full summary\s*»/, ''),
                        rating: parse('[data-testid="hero-rating-bar__aggregate-rating__score"] > span').trim(),
                       // genres: doc.querySelectorAll('[data-testid="genres"] a').textContent,
                       // metascore: parse('.score-meta'),
                    //    yourRating: parse('div[class^="AggregateRatingButton__TotalRatingAmount"]'),
                      //  popularity: parse('.titleReviewBarItem:last-of-type > .titleReviewBarSubItem > div > span', /^([0-9,]+)/),
                        dateFetched: new Date()
                    };
                    if (data && data.id && data.title) {
                        resolve(data);
                    } else {
                        reject('Error getting IMDb data for id ' + id);
                    }
                }
            });
        });
    }

    function getImdbInfoFromTitle(title, year) {
        return getImdbIdFromTitle(title, year).then((id) => {
            return getImdbInfoFromId(id);
        });
    }

    }
)();
