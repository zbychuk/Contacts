
//simple XHR request in pure JavaScript
function load(url, callback) {
    var xhr;
    var def = $.Deferred();
    if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
    else {
        var versions = ["MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"]

        for (var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch (e) { }
        } // end for
    }

    xhr.onreadystatechange = ensureReadiness;

    function ensureReadiness() {
        if (xhr.readyState < 4) {return;}

        if (xhr.status !== 200) {return;}

        // all is well
        if (xhr.readyState === 4 && callback) { callback && callback(xhr); def.resolve(xhr);  }
    }

    xhr.open('GET', url, true);
    xhr.send('');
    return def.promise();
}


//setup the map
var map = new L.Map("map", {
    center: [50,22],
    zoom: 5
})
    .addLayer(new L.TileLayer("http://{s}.tile.cloudmade.com/1a1b06b230af4efdbb989ea99e9841af/998/256/{z}/{x}/{y}.png"));
var contacts, colors, regions, countries;
var getcolors = load('/data/country_colors.json', function (xhr) { colors = JSON.parse(xhr.responseText); });
var getcontacts = load('/data/contacts.json', function (xhr) { contacts = JSON.parse(xhr.responseText); });
var getregions = load('/data/poland-admin.json', function (xhr) { regions = JSON.parse(xhr.responseText); });
var getcountries = load('/data/world-countries.json', function (xhr) { countries = JSON.parse(xhr.responseText); });

$.when(getcolors, getcontacts, getregions, getcountries)
    .done(function() {

        function addLayer(collection, opt) {
            $.each(collection.features,
                function(i, v) {
                    var name = v.properties.name;
                    v.properties.style = {};
                    v.properties.style.color = colors[name] || (opt && opt.color);
                    v.properties.style.fillColor = colors[name] || (opt && opt.fillColor);
                    v.properties.style.fillOpacity = contacts[name] ? 0.4 : 0.2;
                    v.properties.style.weight = 5;
                    v.properties.style.opacity = 0.65;
                });
            var geojson = L.geoJson(collection,
                {
                    onEachFeature: onEachFeature,
                    style: function(feature) { return feature.properties && feature.properties.style; }
                })
                .addTo(map);
            return geojson;
        }

        function onEachFeature(feature, layer) {
            var properties = feature.properties;
            var id = feature.id;
            var c = contacts[id];

            function clickFeature(e) {
                var layer = e.target;
                //map.fitBounds(layer.getBounds());
                var list = '<h3>'+properties.name+'</h3>';
                if (c.orgname)
                    list += '<p><b class=popupheader>' + c.orgname + '</b></p>';
                if (c.orgcomment)
                    list += '<p>' + c.orgcomment + '</p>';
                if (c.orgaddress)
                    list += '<p>' + c.orgwebsite + '</p>';
                if (c.orgwebsite)
                    list+='<p><a href=' + c.orgwebsite + ' target=blank>'+c.orgwebsite+'</a></p>';
                if (c) {
                    var people = c.people;
                    var name;
                    for (name in people) {
                        if (people.hasOwnProperty(name)) {
                            var contact = people[name];
                            list += '<h4>' + name + '</h4>';
                            if (contact.comment) list+='<p>' + contact.comment + '</p>';
                            if (contact.email) list += '<p>E-Mail: ' + contact.email + '</p>';
                            if (contact.phone) list += '<p>Phone: ' + contact.phone + '</p>';
                        }
                    }
                }
                $('#contactDetails').html(list);
                //console.log(layer.feature.properties.name); //country info from geojson
            }

            properties.popup = '<b class=popupheader>' + feature.properties.name + '</b>';

            if (c) {
                if(c.orgname)
                    properties.popup = '<p><b class=popupheader>' + c.orgname + (c.orgwebsite?'</b>('+c.orgwebsite+')</p>':'</b></p>');
                $.each(c.people,
                    function(i, v) {
                        properties.popup += '<p><i>' + i + '</i></p>';
                    });
            }
            layer.on('mouseover',
                function(e) {
                    $('#mapTopRight').html(properties.popup);
                })
            .on('mouseout',
                function(e) {
                    $('#mapTopRight').html('');

                })
            .on({
                click: clickFeature
            });
        }

        var countrylayer = addLayer(countries);
        var regionlayer = addLayer(regions, { color: '#000000', fillColor: '#ffffff' });
        var overlayMaps = {
            "Polish regions": regionlayer
        };
        L.control.layers(null,overlayMaps, {position:'topright'}).addTo(map);
        map.on({
            click: function() {
                //map.setView([0, 0], 4.5);
            }
        });

    });
