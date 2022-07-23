'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');

//Parse URL-encoded bodies
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Set Content-Type for all responses on the routes
router.use((req, res, next) => {
    res.set(('Content-Type', 'application/json'));
    next();
});

//Amazon web scraper API key
const API_KEY = process.env.API_KEY_RAINFORREST;

/******************** Helper Functions ********************************/

function getCatModel() {
    return require('../models/categoriesModel');
}

/******************** Controller Functions ***************************/


/*******************MAIN CATEGORY CHECK ENDPOINT *********************/
// Route checks categoryName parameter in db to see if it is a valid name
// ROUTE: categories/search   METHOD: POST
router.post('/search', async (req, res, next) => {
    try {

        let categoryName = req.body.categoryName.trim();

        console.log(`Controller received Category Name to search: ${categoryName}`);

        let allCategories = await getCatModel().listCategories();
        let categoriesList = allCategories.cats;
        let match = {};

        for (let record of categoriesList) {

            //console.log(record.info.name);

            if (record.info.name.toUpperCase() === categoryName.toUpperCase()) {
                match.validCategory = true;
                match.categoryName = record.info.name;
                match.categoryNumber = record.info.id;
                match.url = record.info.link;
                match.path = record.info.path;
                match.navUrl = record.info.link;  //link to navigate to in anchor tag
                break;
            } else {
                match.validCategory = false;
                match.categoryName = categoryName;
                match.categoryNumber = "NA";
                match.url = "NA";
                match.path = "NA";
                match.navUrl = "https://amaz-search-swenddaj-1018.uc.r.appspot.com"
            }
        }

        //console.log(JSON.stringify(match));
        //res.status(200).send(match);
        res.render('searchDemo', {
            catName: match.categoryName,
            validityCheck: match.validCategory,
            catNum: match.categoryNumber,
            pageUrl: match.url,
            path: match.path,
            navUrl: match.navUrl
        });

    } catch (err) {

        console.error("ERROR Caught in outer block of /:categoryName in Controller");

        if (!err.statusCode) {
            err.statusCode = 500;
        }

        let status = err.statusCode;

        res.status(status).json({ 'Error': 'Thrown in outer block of controller' });
    }
})

/***********************LIST CATEGORY NAMES *************************/
// Route will list category names contained in db
// /categories/listCategories

router.get('/listCategories', async (req, res, next) => {

    try {

        let allCategories = await getCatModel().listCategories();
        let categoriesList = allCategories.cats;
        let result = [];

        for (let record of categoriesList) {

            let newRecord = {}
            newRecord.categoryName = record.info.name;
            newRecord.categoryNumber = record.info.id;
            newRecord.url = record.info.link;
            newRecord.path = record.info.path;
            newRecord.hasChildren = record.info.has_children;

            result.push(newRecord);
        }
        //console.log(JSON.stringify(result));
        res.status(200).send(result);

    } catch (err) {

        console.error("ERROR Caught in outer block of /listCategories in Controller");

        if (!err.statusCode) {
            err.statusCode = 500;
        }

        let status = err.statusCode;

        res.status(status).json({ 'Error': 'Thrown in outer block of controller' });
    }

});

// This route just allows calling the rainforest API and then saving
// the results to the db

// ROUTE: /categories/parentCategory/:parentId
router.get('/parentCategory/:parentId', async (req, res, next) => {

    try {
        let parentId = req.params.parentId;
        console.log(`Controller received parentId param: ${parentId}`);

        // parameters required for category search in rainforesstapi.com
        const params = {
            api_key: API_KEY,
            domain: "amazon.com",
            parent_id: parentId,
            type: "standard"
        }

        try {
            let apiResponse = await axios.get('https://api.rainforestapi.com/categories', { params });
            let result = apiResponse.data;
            let data = {};
            console.log("Reached point AFTER API read, but BEFORE updateCategories in db");

            try {
                for (const cat of result.categories) {
                    data.info = cat;
                    console.log(JSON.stringify(data.info));
                    let newRecord = await getCatModel().updateCategories(null, data);

                    if (newRecord) {
                        console.log("New Record saved to DB");
                    }

                    data = {};
                }
            } catch (err) {
                console.error('Error when waiting for promise from updateCategories');

                let error = new Error('Some issue with writing to the database');

                if (!err.statusCode) {
                    error.statusCode = 500;
                } else {
                    error.statusCode = err.statusCode;
                }
                throw error;
            }
            res.status(200).send(apiResponse.data);

        } catch (err) {
            // catch and print the error
            console.error("Error: " + err.message);

            if (!err.statusCode) {
                error.statusCode = 500;
            } else {
                error.statusCode = err.statusCode;
            }

            let error = new Error(`{Error type: ${error.statusCode}`);
            throw error;
        }
    } catch (err) {
        console.error("ERROR Caught in outer block of controller");

        if (!err.statusCode) {
            err.statusCode = 500;
        }
        let status = err.statusCode;

        res.status(status).json({ 'Error': 'Thrown in outer block of controller' });
    }
});

/* ---------------------- End Controller Functions -------------------------- */
module.exports = router;