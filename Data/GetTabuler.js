fs = require('fs')
fs.readFile('contacts.json', function(err,data) {
    
    console.log("Read successfully - "+data[1]+' '+typeof(data))
    for(var x in data) {
        console.log(x+',')
    } 
})