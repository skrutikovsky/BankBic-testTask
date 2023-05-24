import fs from 'node:fs';
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import iconv from 'iconv-lite';
import stream from "stream/promises";


const dataHandler = function () {
    const buf = new AdmZip('./archive.zip', {}).getEntries()[0].getData()
    const zip = iconv.decode(buf, "Windows-1251").toString()

    //--------- ПАРСИНГ ДАННЫХ --------------

    const getBic = (x) => {
        return /BIC="[0-9]{9}"/.exec(x)[0].substring(5, 14)
    }

    const getName = (x) => {
        const a = /NameP=".*?="/.exec(x)
        a[0] = a[0].slice(0,-1).split('\"')
        a[0].pop()
        a[0] = a[0].join('')
        return a[0].substring(6, a[0].length)
    }

    const getAccounts = (x) => {
        const arr = x.split("Account=")
        arr.shift()
        const newArr = [];
        arr.forEach((x) => newArr.push(x.substring(1, 21)))
        return newArr
    }

    //--------- СБОР ДАННЫХ --------------

    const textArr = zip.split("</BICDirectoryEntry>");
    textArr.pop()
    const resultArr = []
    for (let bank of textArr) {
        let accounts = getAccounts(bank);
        if (accounts.length !== 0) {
            for (let acc of accounts) {
                resultArr.push([getBic(bank), getName(bank), acc])
            }

        }
    }
    return resultArr
}

const getArch = function () {
    return (async () => {
        const data  = await fetch("https://www.cbr.ru/s/newbik").then(res => res.body)
        await stream.pipeline(data,fs.createWriteStream('./archive.zip')).catch(console.error);
        return dataHandler()
    })()
}

getArch().then(res => console.log(res))
/* Здравствуйте! Представляю вторую версию тестового задания. Порефачил код,
 разобрался с кодировкой, использовал все одобренные модули */
