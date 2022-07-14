'use strict';

const express = require('express');
//const res = require('express/lib/response');
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


//const projectId = process.env.PROJECT_ID;
//const CLIENT_APP_ID = process.env.CLIENT_APP_ID;
const API_KEY = process.env.API_KEY;
//const urlString = 'https://final-peertutor-1215pm.uc.r.appspot.com';


/***************** Helper Functions ********************************/

function getHttpStatusCode({ error, response }) {
    /**
     * Check if the error object specifies an HTTP
     * status code which we can use.
     */
    const statusCodeFromError = error.status || error.statusCode;
    if (isErrorStatusCode(statusCodeFromError)) {
        return statusCodeFromError;
    }

    /**
     * The existing response `statusCode`. This is 200 (OK)
     * by default in Express, but a route handler or
     * middleware might already have set an error HTTP
     * status code (4xx or 5xx).
     */
    const statusCodeFromResponse = response.statusCode;
    if (isErrorStatusCode(statusCodeFromResponse)) {
        return statusCodeFromResponse;
    }

    /**
     * Fall back to a generic error HTTP status code.
     * 500 (Internal Server Error).
     *
     * @see https://httpstatuses.com/500
     */
    return 500;
}

/**
 * Extract an error stack or error message from an Error object.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 *
 * @param {Error} error
 * @return {string} - String representation of the error object.
 */
function getErrorMessage(error) {
    /**
     * If it exists, prefer the error stack as it usually
     * contains the most detail about an error:
     * an error message and a function call stack.
     */
    if (error.stack) {
        return error.stack;
    }

    if (typeof error.toString === "function") {
        return error.toString();
    }

    return "";
}

/**
 * Log an error message to stderr.
 *
 * @see https://nodejs.org/dist/latest-v14.x/docs/api/console.html#console_console_error_data_args
 *
 * @param {string} error
 */
function logErrorMessage(error) {
    console.error(error);
}

/******************** Controller Functions ***************************/
// ROUTE: /products?search=[search string]&author=[search string]&product=[search string]
router.get('/', async (req, res, next) => {

    try {

        //check accept header is JSON
        /*
        if (req.header("Accept") !== 'application/json') {
            const err = generateError('406', 'GET controller');
            throw err;
        }
        */

        let product = req.query.product;
        let author = req.query.author;
        let searchString = req.query.search;
        console.log(searchString);

        // set up the request parameters
        const params = {
            api_key: API_KEY,
            type: "search",
            amazon_domain: "amazon.com",
            search_term: product.concat(` ${searchString} ${author}`)
        }

        let amazResult = await axios.get('https://api.asindataapi.com/request', { params })
            .catch(err => {
                // catch and print the error
                console.log(err);
                let status = getHttpStatusCode(err);
                let error = new Error('Error type: ' + status);
                error.statusCode = status;
                throw error;
            })
        //process result here

        // print the JSON response from ASIN Data API
        //console.log(JSON.stringify(amazResult.data, 0, 2));

        res.status(200).send(amazResult.data);

    } catch (err) {
        const errorMessage = getErrorMessage(err);
        logErrorMessage(errorMessage);

        if (res.headersSent) {
            return next(err);
        };

        const errorResponse = {
            statusCode: getHttpStatusCode({ err, res }),
            body: undefined
        }

        errorResponse.body = errorMessage;
        res.status(errorResponse.statusCode);

        res.format({
            //
            // Callback to run when `Accept` header contains either
            // `application/json` or `*/*`, or if it isn't set at all.
            //
            "application/json": () => {
                /**
                 * Set a JSON formatted response body.
                 * Response header: `Content-Type: `application/json`
                 */
                res.json({ message: errorResponse.body });
            },
            /**
             * Callback to run when none of the others are matched.
             */
            default: () => {
                /**
                 * Set a plain text response body.
                 * Response header: `Content-Type: text/plain`
                 */
                res.type("text/plain").send(errorResponse.body);
            },
        });

        /**
         * Ensure any remaining middleware are run.
         */
        next();
    }
});



/* ------------- End Controller Functions ------------- */

module.exports = router;