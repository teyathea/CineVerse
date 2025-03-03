exports.handler = async function () {
    return {
        statusCode: 200,
        body: JSON.stringify({
            TMDB_API_KEY: process.env.TMDB_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY
        })
    };
};