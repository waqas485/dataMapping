const sequelize = require('../config/connection');
//const resi = require('../../products')
var promiseLimit = require('promise-limit')


module.exports = async (req, res, next) => {
    dbAuth();
    async function dbAuth() {
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
                      OFFSET 0 ROWS 
                  FETCH NEXT 500 ROWS ONLY`
        );

        try {
            let arr = []
            const promises = [];
            for (let i = 0; i < results.length; i++) {
                console.log(i);
                promises.push(getData(results[i].url, results[i]));
            }
            async function getData(url, obj) {
                try {

                    if (
                        !obj.url.includes('www.electrical.com') &&
                        !obj.url.includes('www.widespreadsales.com') &&
                        obj.suffix != null && obj.suffix != ''
                    ) {

                        obj.url = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
                        arr.push(obj)
                    }
                    else if (obj.url.includes('www.electrical.com') && obj.url.includes('www.widespreadsales.com') &&
                        obj.suffix != null && obj.suffix != '') {
                        obj.url = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
                        arr.push(obj)
                    } else {
                        arr.push(obj)
                    }
                    return async () => await fetch(url)
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
            console.log(results.length,'results');
            console.log(promises.length,'promises');
            var limit = promiseLimit(1)
            Promise.allSettled(promises.map((i) => {
                return limit(() => job(i))
            })).then(pr => {
                for (let index = 0; index < pr.length; index++) {
                    if (pr[index].status == 'fulfilled') {
                        console.log(index);
                        arr[index].status = 200 ///////
                        //  console.log(arr[index]);
                    } else {
                        arr[index].status = 404
                        //  console.log(arr[index]);
                    }
                }
                return res.status(201).json({
                    message: "Record get successfuly",
                    data: arr
                });
            })

            async function job(promise) {
                console.log(promise, 'started')
                return await new Promise(function (resolve) {
                    try {
                        setTimeout(() => {
                            resolve(promise);
                            console.log('finished')
                        }, 2500)
                    } catch (error) {
                        console.log(error);
                    }
                })
            }
        } catch (error) {
            console.log(error);
        }

    }

}