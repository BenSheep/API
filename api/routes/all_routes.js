// export this custom route. If someone requests only the base url of the API URL he will be refered to use /graphql to access the API
module.exports = (app) => {
    app.get('/', (req, res) => {
        res.json('"There\'s not much to do here. Maybe try /graphql"');
    });
};
