// package to set up cron jobs
const CronJob = require('cron').CronJob;

const axios = require('../../global/axios');
const { ENDPOINTS } = require('../../config/weather.config');
const { TEST_SUITE_SOURCE } = require('../../global/messages');

// get access to the weather model so we can create an instance
const Weather = require('../../api/models/weatherModel');
const Location = require('../../api/models/locationModel');

// FUNCTIONS
const { fetchWeatherData } = require('../../global/functions');

/**
 * Count to limit the number of weather reports that are stored in the database per cron job. For more details
 *
 * @see prepareAndSave
 */
const COUNT = 8;

Location.find({}, (err, locations) => {
    if (err) {
        throw new Error(err);
    }

    if (locations.length) {
        locations.forEach((location) => {
            // Set up a cron job every 3 hours of each different city
            const cron = new CronJob('0 0 */3 * * *', () => {
                this.weatherCronJob(location.name);
            });
            cron.start();
        });
    }
});

/**
 * Function that receives the open weather api response object and prepares the object to be used by our weather model
 * Throughout development process, to save up on space, we will hold information only for the next 24 hours
 *
 * The API response is a 5 day 3-hourly forecast Therefore, we will loop only through the first 8 elements: 3x8 = 24 hours
 *
 * @param {Object} weatherObj
 *
 * @returns {Boolean} Returns true if all weather objects are saved else throws error
 */
const prepareAndSave = async (weatherObj) => {
    const weatherList = weatherObj.list;

    // make sure the list has elements
    if (weatherList.length > 0) {
        // Get data from the open weather API response

        const city = weatherObj.city.name || '';

        const location = {
            lat: weatherObj.city.coord.lat || 0,
            lng: weatherObj.city.coord.lon || 0,
        };

        // Loop through the weather reports. there are 40 reports. 8 reports per day for 5 days
        for (let i = 0; i < COUNT; i++) {
            // get the current report
            const report = weatherList[i];

            // create the weather object
            const weather = new Weather({
                timestamp: report.dt || 0,
                temp: report.main.temp || '',
                description: report.weather[0].description || '',
                location,
                city,
            });
            // successful save to database
            try {
                const success = await weather.save();

                // throw error even if one object is not stored
                if (!success) {
                    throw new Error();
                }
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    // if all data is store return true
    return true;
};

/**
 * Function that sends a message to a discord channel that lets us know the state of the weather cron job
 *
 * @param {boolean} success Determined by if all weather data are succesfully stored in the dabase
 * @param {boolean} location The location the weather data was for
 * @param {string} source The source of the call. Defaults to empty string and is hardcoded 'TEST' for test suites
 */
const notifyDiscordChannel = (success, city, source = '') => {
    let content = `${city} weather data fetched at ${new Date()}`;

    if (!success) {
        content = 'Something went wrong';
    }

    if (source !== '' && source === TEST_SUITE_SOURCE) {
        content += ` | ${source}`;
        return { content };
    }

    const body = { content };

    axios
        .post(
            'https://discordapp.com/api/webhooks/691348810835820595/TpPlu4t_78e_g4de7r00noLKpBEUbu3fZJS0rP3DzaoXyGYFofGF6qiNb4-_eXc8HsIu',
            body
        )
        .catch((err) => {
            // do nothing
            throw new Error(err);
        });
};

/**
 * Function that deletes all data when the cron job starts. That way, we ensure that there is no weather data for prior times
 * After alpha release this is prone to change
 * @change
 *
 * @returns {Boolean} Returns true if deletion was successful
 */
const deleteWeatherData = (city) => {
    return Weather.deleteMany({ city }).then((res, err) => {
        if (err) {
            throw new Error(err);
        }

        return res;
    });
};

/**
 * Function that runs every 3 hours. Deletes all weather data for a specific location and then fetches new. Notifies discord channel
 * Function is being exported so it can be called during testing
 */
module.exports.weatherCronJob = async (location, source = '') => {
    /**
     * Delete data. No prior timestamp data wanted during dev. Might change after alpha
     *
     * @see deleteWeatherData
     */

    await deleteWeatherData(location);

    // shot the request to the open weather API
    return fetchWeatherData(ENDPOINTS.FORECAST, location).then(async (res) => {
        // save data
        const success = await prepareAndSave(res);

        // use discord bot. Used during dev for debugging purposes
        return notifyDiscordChannel(success, location, source);
    });
};
