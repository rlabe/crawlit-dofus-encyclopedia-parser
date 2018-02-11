var fs = require('fs');
var Promise = require('bluebird');

var Nightmare = require('nightmare');
var nightmare = new Nightmare();

var CLI = require('clui'),
    Progress = CLI.Progress;

var currentPosition = 0;
var itemsList = [];
var thisProgressBar = new Progress(20);

var getItems = exports.getItems = function(links, back) {
	getData(links[currentPosition],back, function(item,back){
		itemsList.push(item);
		console.log(thisProgressBar.update(currentPosition, links.length));
		currentPosition++;
        // any more items in array?
        if(currentPosition < links.length) {
         	getItems(links, back);   
        }else {
			back(itemsList);
		}
	});
};

function getData(url, back, callback) {
	new Promise(function(resolve, reject) {
	nightmare
		.goto(url)
		.inject('js', __dirname + '/dependencies/jquery.min.js')
		.evaluate(function () {
			try {
				var itemId = document.URL.replace(/\D/g,'');
				var type = $('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-encyclo-detail-type.col-xs-6').find('span').text().trim();
				var name = $('h1.ak-return-link').text().trim();
				var description = $('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-container.ak-panel:first').find('div.ak-panel-content').text().trim();
				var lvl = $('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-encyclo-detail-level.col-xs-6.text-right').text().trim().replace(/\D/g,'');
				var imgUrl = $('div.ak-encyclo-detail-illu').find('img').attr('src').replace('dofus/ng/img/../../../', '');
				
				var item = {
					id: itemId,
					name: name,
					description: description,
					lvl: lvl,
					type: type,
					imgUrl: imgUrl,
					url: document.URL
				}
				
				item["stats"] = [];
				item["condition"] = [];
				if(typeof $('div.ak-container.ak-panel.ak-crafts').next('div.ak-container.ak-panel').find('div.ak-panel-title').find('a').attr('href') !== 'undefined') {
					var setUrl = 'http://www.dofus-touch.com' + $('div.ak-container.ak-panel.ak-crafts').next('div.ak-container.ak-panel').find('div.ak-panel-title').find('a').attr('href');
					var setId = $('div.ak-container.ak-panel.ak-crafts').next('div.ak-container.ak-panel').find('div.ak-panel-title').find('a').attr('href').replace(/\D/g,'');
					var setName = $('div.ak-container.ak-panel.ak-crafts').next('div.ak-container.ak-panel').find('div.ak-panel-title').find('a').text();
					item.set = {
						id: setId,
						url: setUrl,
						name: setName
					}
				}else {
					item["set"] = [];
				}
				$('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-container.ak-panel:not(.no-padding)').find('div.ak-list-element').each(function(i, element){
					item["stats"].push($(this).find( "div.ak-title" ).text().trim());
				});
				$('div.ak-encyclo-detail-right.ak-nocontentpadding').find('div.ak-container.ak-panel.no-padding').find('div.ak-list-element').each(function(i, element){
					item["condition"].push($(this).find( "div.ak-title" ).text().trim());
				});
				return item;
			} catch(err){
				return [err];
			}
		})
		.then((htmlRes) => {
			resolve(htmlRes);
		});
	}).then(
    // On affiche un message avec la valeur
    function(item) {
      callback(item, back);
    }).catch(
      // Promesse rejetée
      function(err) {
        console.log("promesse rompue");
        console.log(err);
		process.exit();
      });
}

function getLinksFromFile() {
	var jsonFile = fs.readFileSync("amuletUrl.json", "utf8");
	obj = JSON.parse(jsonFile);
	return obj;
}