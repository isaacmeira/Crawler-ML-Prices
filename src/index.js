const express = require('express');
const cors = require('cors');
const rp = require('request-promise')
const cheerio = require('cheerio')
const axios = require('axios');

const app = express();

app.use(cors())
app.use(express.json());

let ids = [];
let catchedData = [];
let sellerData = [];

app.post('/', async  (req, res)  => {
  const { search, int } = req.body;

  const options = {
    uri: `https://lista.mercadolivre.com.br/${search}`,
    transform: function (body) {
      return cheerio.load(body)
    }
  }

  const $ = await rp(options);
    $('#searchResults li.article').each((index, item) => {
     if(index < int ) {
     $(item).find('div.rowItem').attr('id').match('PAD') ? '' :
        ids.push($(item).find('div.rowItem').attr('id'));     
      }         
   })
  await receiveData();
  return res.json(catchedData)
 
})

async function receiveData () {
const promises =  ids.map((id) => axios.get(`https://api.mercadolibre.com/items/${id}`));
const responses = await Promise.all(promises);

responses.map((data)=>{

  const parsedData = {
    name: data.data.title,
    link: data.data.permalink,
    price: data.data.price,
    sellerId: data.data.seller_id,
    store: data.data.official_store_id,
    state: data.data.seller_address.state.name
  }

  if (data.data.official_store_id) {
    sellerData.push({
    seller : data.data.seller_id,
    store: data.data.official_store_id }); 
  }
 
  catchedData.push(parsedData);

})
  await getStoreName();
}

async function getStoreName() {
  const salePromises = sellerData.map((element) => axios.get(`https://api.mercadolibre.com/users/${element.seller}/brands/${element.store}`));
  const responses = await Promise.all(salePromises);

  responses.map((data) => {
      catchedData.forEach(element => {
        element.store !== null ? element.store = data.data.name : null;
        delete element.sellerId
      });
    }
  )
}

 
app.listen(3333, () => {
  console.log('Backend Started 👌');
}) 