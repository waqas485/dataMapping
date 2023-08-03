const sqlConfig = require('./config/mssql')
const fs = require('fs')
const sql = require('mssql')
var promiseLimit = require('promise-limit')
const P_LIMIT = promiseLimit(10);
const csvMerger = require('csv-merger');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const data = require('./data')
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

let totalFaulty = 0
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
              FETCH NEXT 10 ROWS ONLY

        ) t`
    //return count.recordset[0].Counted
    return data.length
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
async function getData(url, obj, count) {
    try {
        console.log('came here for process***********');
        const fetchRes = await fetch(url)
        let done = 0
        console.log('These are done count', fetchRes?.status, done++);
        return { status: fetchRes?.status, ...obj }
    } catch (error) {
        if (error) {
            await waitFor((count * 1000) + 3000);
            count = Number(count) + 1
            if (count < 4) {
                console.log('this is retry count*********',url,error, count);
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
    for (let i of pArray) {
        console.log(i, 'faulted array after processed');
    }
    const response = await Promise.all(pArray);
    console.log(response,'Retry final write --------------------------------');
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
        //let results = result.recordset
        let results = data
        let formatedArray = []
        // for (let obj of results) {
        //     if (
        //         !obj.url.includes('www.electrical.com') &&
        //         !obj.url.includes('www.widespreadsales.com') &&
        //         typeof (obj.suffix) !== (null || undefined || "")
        //     ) {
        //         obj.url = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
        //         formatedArray.push(obj)
        //     }
        //     else {
        //         formatedArray.push(obj)
        //     }
        // }
         formatedArray = data
        const promises = [];
        for (let i = 0; i < formatedArray.length; i++) {
            console.log(formatedArray[i]);
            promises.push(P_LIMIT(() => getData(formatedArray[i].url, formatedArray[i], 0)));
        }
        const response = await Promise.all(promises);
        faultedArray = response.filter((e) => e.status == 408)
        if(faultedArray.length > 0){
            faultedArray[0].url = 'https://www.electrical.com/img/3UA6200-2H-63.jpg'
            delete faultedArray[0].status
            console.log(faultedArray,'*****************************88faultedArray');
        }
        let all = response.filter((e) => e.status && e.status !== 408)
        console.log(all,'first all write ***************');
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
    let WRITE_CHUNK_SIZE = 2
    for (let skip = 0; skip < finalCount; skip += WRITE_CHUNK_SIZE) {
        let offset = skip;
        let fetchCall = 2
        await dbAuth(offset, fetchCall);
    }
    console.log(totalFaulty, '**********************---------------me here');

}

run();


