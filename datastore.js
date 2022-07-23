'use strict';

const { Datastore } = require('@google-cloud/datastore');
const projectId = process.env.PROJECT_ID;
//const projectId = 'amaz-search-swenddaj-1018'

module.exports.Datastore = Datastore;
//module.exports.datastore = new Datastore();

// Instantiate a datastore client
module.exports.datastore = new Datastore({
    projectId: projectId,
});

module.exports.fromDatastore = function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

module.exports.toDatastore = function toDatastore(obj, nonIndexed) {
    nonIndexed = nonIndexed || [];
    const results = [];
    Object.keys(obj).forEach((k) => {
        if (obj[k] === undefined) {
            return;
        }

        results.push({
            name: k,
            value: obj[k],
            excludeFromIndexes: nonIndexed.indexOf(k) !== -1
        });
    });
    return results;
}