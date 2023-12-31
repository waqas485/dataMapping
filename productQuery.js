const sqlConfig = require('./config/mssql')
const fs = require('fs')
const sql = require('mssql')
var promiseLimit = require('promise-limit')
const P_LIMIT = promiseLimit(10);
const csvMerger = require('csv-merger');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
fs.rmSync("./file.csv", {
    force: true,
});

const csvWriter = createCsvWriter({
    path: './file.csv',
    header: [
        { id: 'suffix', title: 'suffix' },
        { id: 'product_id', title: 'product_id' },
        { id: 'url', title: 'url' },
        { id: 'name', title: 'name' },
        { id: 'status', title: 'status' }
    ],
    append: true
});
let obj = {
    suffix: 'suffix',
    product_id: 'product_id',
    url: 'url',
    name: 'name',
    status: 'status'
}

csvWriter.writeRecords([obj])
    .then(() => {
        console.log('static record...Done');
    });
async function recordCount() {
    let pool = await sql.connect(sqlConfig)
    const count = await pool.request().query
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
                  OFFSET 0 ROWS 
              FETCH NEXT 10000 ROWS ONLY

        ) t`
    return count.recordset[0].Counted

}

let faultedArray = [];
async function waitFor(sec) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, sec)
    })
}
async function writeCsvRecords(all) {
    return new Promise((resolve) => {
        csvWriter.writeRecords(all)
            .then(() => {
                console.log('...Done');
                resolve();
            });
    })

}
////////////// get data
let done = 0
async function getData(url, obj, count) {
    try {
        const fetchRes = await fetch(url)
        console.log('These are done count here ******', done++);
        return { status: fetchRes?.status, ...obj }
    } catch (error) {
        if (error) {
            await waitFor((count * 1000) + 3000);
            count = Number(count) + 1
            if (count < 4) {
                await getData(url, obj, count);
            }
            return { status: 408, ...obj }
        }
    }
}

async function retry(faultedArray) {
    totalFaulty += faultedArray.length
    let pArray = []
    for (let i = 0; i < faultedArray.length; i++) {
        pArray.push(P_LIMIT(() => getData(faultedArray[i].url, faultedArray[i], 0)));
    }
    const response = await Promise.all(pArray);
    await writeCsvRecords(response)
}



async function dbAuth(offset, fetchCall) {
    let pool = await sql.connect(sqlConfig)
    const result = await pool.request().query
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
    try {
        ///// Format all urls by condition and making new array here
        let results = result.recordset
        let formatedArray = []
        for (let obj of results) {
            if (
                !obj.url.includes('www.electrical.com') &&
                !obj.url.includes('www.widespreadsales.com') &&
                typeof (obj.suffix) !== (null || undefined || "")
            ) {
                obj.url = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
                formatedArray.push(obj)
            }
            else {
                formatedArray.push(obj)
            }
        }
        const promises = [];
        for (let i = 0; i < formatedArray.length; i++) {
            promises.push(P_LIMIT(() => getData(formatedArray[i].url, formatedArray[i], 0)));
        }
        const response = await Promise.all(promises);
        faultedArray = response.filter((e) => e.status == 408)
        if(faultedArray.length > 0){
            faultedArray.forEach(e => {
                delete e.status
            });
        }
        let all = response.filter((e) => e.status && e.status !== 408)
        await writeCsvRecords(all);
    } catch (error) {
        console.log(error);
    }
    if (faultedArray.length > 0) {
        await retry(faultedArray);
    }
    faultedArray = [];

}

async function run() {
    let count = await recordCount();
    let finalCount = count
    let WRITE_CHUNK_SIZE = 1000
    for (let skip = 0; skip < finalCount; skip += WRITE_CHUNK_SIZE) {
        let offset = skip;
        let fetchCall = 1000
        await dbAuth(offset, fetchCall);
    }

}

run();


