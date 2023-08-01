
const sequelize = require('../config/connection');
var promiseLimit = require('promise-limit')
const P_LIMIT = promiseLimit(10);
const ObjectsToCsv = require('objects-to-csv');
async function recordCount() {
    await sequelize.authenticate();
    const [count, metadata] = await sequelize.query(
        `SELECT COUNT(*) AS Counted FROM(
            SELECT ALL
            product_media.suffix,
            product_media.product_id,
            product_media.url,
            products.name
              FROM [dbo].[product_media]
              INNER JOIN products ON product_media.product_id = products.id
              ORDER BY
              product_id

    ) t`
    );
    return count
}

module.exports = async (req, res, next) => {
    let count = await recordCount();
    let finalCount = count[0].Counted
    let WRITE_CHUNK_SIZE = 1000
    let fileCount = 0
    for (let skip = 0; skip < finalCount; skip += WRITE_CHUNK_SIZE) {
        let offset = skip;
        let fetchCall = 1000
        let filename = `file_${fileCount++}`
        dbAuth(offset, fetchCall, filename);
    }


    async function dbAuth(offset, fetchCall, filename) {
        await sequelize.authenticate();
        const [results, metadata] = await sequelize.query(
            `SELECT ALL
                    product_media.suffix,
                    product_media.product_id,
                    product_media.url,
                    products.name
                      FROM [dbo].[product_media]
                      INNER JOIN products ON product_media.product_id = products.id
                      ORDER BY
                      product_id
                      OFFSET ${offset} ROWS 
                  FETCH NEXT ${fetchCall} ROWS ONLY`
        );

        try {
            ///// Format all urls by condition and making new array here
            let formatedArray = []
            let pid
            for (let obj of results) {
                // if (obj.url.includes('http://res.cloudinary.com')) {
                //     pid = obj.product_id
                //     console.log(pid);
                // }
                if (
                    !obj.url.includes('www.electrical.com') &&
                    !obj.url.includes('www.widespreadsales.com') &&
                    typeof(obj.suffix) !== (null || undefined || "")
                ) {
                    // if(pid == obj.product_id){console.log(true)}else{console.log(false,obj)}
                    obj.url = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
                    formatedArray.push(obj)
                }
                else {
                    formatedArray.push(obj)
                }
            }

            const promises = [];
            for (let i = 0; i < formatedArray.length; i++) {
                promises.push(P_LIMIT(() => getData(formatedArray[i].url, formatedArray[i])))
            }
            let done = 0;
            async function getData(url, obj) {
                try {
                    const fetchRes = await fetch(url)
                    console.log('These are done count', done++);
                    return { status: fetchRes?.status, ...obj }
                } catch (error) {
                }
            }
            const response = await Promise.all(promises);

            async function conversion(response) {
                const csv = new ObjectsToCsv(response);
                await csv.toDisk(`./${filename}.csv`);
            }
            conversion(response);
        } catch (error) {
            console.log(error);
        }

    }


}