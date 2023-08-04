const sqlConfig = require('./config/mssql')
const fs = require('fs')
const sql = require('mssql')
var promiseLimit = require('promise-limit')
const P_LIMIT = promiseLimit(10);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
fs.rmSync("./file.csv", {
    force: true,
});

const csvWriter = createCsvWriter({
    path: './file.csv',
    header: [
        { id: 'suffix', title: 'suffix' },
        { id: 'product_id', title: 'product_id' },
        { id: 'name', title: 'name' },
        { id: 'dbURL', title: 'dbURL' },
        { id: 'dbStatus', title: 'dbStatus' },
        { id: 'formatedURL', title: 'formatedURL' },
        { id: 'formatedStatus', title: 'formatedStatus' }
    ],
    append: true
});
let obj = {
    suffix: 'suffix',
    product_id: 'product_id',
    name: 'name',
    dbURL: 'dbURL',
    dbStatus: 'dbStatus',
    formatedURL: 'formatedURL',
    formatedStatus: 'formatedStatus'
}

csvWriter.writeRecords([obj])
    .then(() => {
        console.log('static record...Done');
    });


/// Function for getting all records count of table
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
/// CVS writer promise
async function writeCsvRecords(all) {
    return new Promise((resolve) => {
        csvWriter.writeRecords(all)
            .then(() => {
                console.log('...Done');
                resolve();
            });
    })

}
///// Get data for format all records and fetch with retry
let done = 0
async function getData(dbURL, formatedURL, obj, count) {
    try {
        console.log('These are done count here ******', done++);
        if (formatedURL !== '') {
            const fetchRes1 = await fetch(dbURL)
            const fetchRes2 = await fetch(formatedURL)
            return { dbStatus: fetchRes1?.status, formatedStatus: fetchRes2?.status, ...obj }
        } else {
            const fetchRes1 = await fetch(dbURL)
            return { dbStatus: fetchRes1?.status, formatedStatus: '', ...obj }
        }

    } catch (error) {
        if (error) {
            await waitFor((count * 1000) + 3000);
            count = Number(count) + 1

            if (count < 4) {
                await getData(dbURL, formatedURL, obj, count);
            }
            return { formatedStatus: 408, dbStatus: 408, ...obj }
        }
    }
}

//// Here will came faulted array with 408 status records for retry fetch
async function retry(faultedArray) {
    let pArray = []
    for (let i = 0; i < faultedArray.length; i++) {
        pArray.push(P_LIMIT(() => getData(faultedArray[i].dbURL, faultedArray[i].formatedURL, faultedArray[i], 0)));
    }
    const response = await Promise.all(pArray);
    await writeCsvRecords(response)
}


////main function
async function dbAuth(offset, fetchCall,pool) {
    //let pool = await sql.connect(sqlConfig)
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
        console.log(results.length,'^^^^^^^^^^^^^^^^^^^^^^^^');
        let formatedArray = []
        for (let obj of results) {
            if (
                !obj.url.includes('www.electrical.com') &&
                !obj.url.includes('www.widespreadsales.com') &&
                typeof (obj.suffix) !== (null || undefined || "")
            ) {
                obj.dbURL = obj.url
                obj.formatedURL = `https://www.electrical.com/img/${encodeURIComponent(encodeURIComponent(obj.name))}-${obj.suffix}.jpg`
                formatedArray.push(obj)

            } else {
                obj.dbURL = obj.url
                obj.formatedURL = ''
                formatedArray.push(obj)
            }

        }
        const promises = [];
        for (let i = 0; i < formatedArray.length; i++) {
            promises.push(P_LIMIT(() => getData(formatedArray[i].dbURL, formatedArray[i].formatedURL, formatedArray[i], 0)));
        }
        const response = await Promise.all(promises);
        faultedArray = response.filter((e) => e.dbStatus == 408 && e.formatedStatus == 408);

        if (faultedArray.length > 0) {
            faultedArray.forEach(e => {
                delete e.dbStatus
                delete e.formatedStatus
            });

        }

        let all = response.filter((e) => e.dbStatus && e.dbStatus !== 408)
        await writeCsvRecords(all);

    } catch (error) {
        console.log(error);

    }

    if (faultedArray.length > 0) {
        await retry(faultedArray);
    }
    faultedArray = [];

}
//// Script running from here
async function run() {
    let pool = await sql.connect(sqlConfig)
    let count = await recordCount();
    //console.log(count,'this is ttal count *********************8');
    let finalCount = count
    let WRITE_CHUNK_SIZE = 1000
    let faultedCount = 0
    for (let skip = 0; skip < finalCount; skip += WRITE_CHUNK_SIZE) {
        let offset = skip;
        let fetchCall = 1000
        console.log(offset,fetchCall,'this is fetch offset call***********************************');
        await dbAuth(offset, fetchCall,pool);  ///This is main function calling

    }
}
run();


