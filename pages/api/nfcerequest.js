import chromium from 'chrome-aws-lambda';


export default async function handler(req, res){
    
    if(req.method ==='POST'){
        let browser = null;
        try {
            browser = await getBrowserInstance();
            let page = await browser.newPage();
            let url = req.body.data;
            await page.goto(url.url.toString(), {waitUntil: 'networkidle2', timeout: 0});

            const pageContent = await page.evaluate(() => {  
                var prd =  [];          
               
               var table = document.querySelector('#tabResult');
               if(table != null && table != undefined){
                   for(let i in table.rows){
                       let row = table.rows[i];
                       if(!isNaN(i)){
                           let product = {
                               id: parseFloat(i) +1,
                               productCode: row.children[0].children[1].innerHTML.replace('(Código: ','').replace(')','').replace('\n','').replace(' ','').trim(),
                               productName: row.children[0].children[0].innerHTML.replace(/\s\s+/g, ' '),
                               quantity: row.children[0].children[3].innerHTML.replace('\n','').replace('<strong>Qtde.:</strong>','').replace(' ','').trim(),
                               unitaryValue: row.children[0].children[5].innerHTML.replace('\n','').replace('<strong>Vl. Unit.:</strong>','').replace('&nbsp;','').replace(' ','').trim(),
                               unity: row.children[0].children[4].innerHTML.replace('\n','').replace('<strong>UN: </strong>','').replace('&nbsp;','').replace(' ','').trim(),
                               amount: row.children[1].children[1].innerHTML.replace('\n','').replace('<strong>UN: </strong>','').replace('&nbsp;','').replace(' ','').trim(),                            
                           }
                            prd.push(product);                        
                       }
                   }
               }
       
               return {
                   title: document.querySelector('.txtTopo').innerHTML,
                   chave: document.querySelector('.chave').innerHTML,
                   vlrTotal: document.querySelector('.txtMax').innerHTML,
                   products: Array.from(prd),
                   produtos: [prd]
               };
           });
       
           browser.close();
           res.status(200).json(pageContent);

        } catch (error) {
            return res.status(400).json({status: 'Erro',
                                        message: error.message || 'Something went wrong'})
        }
        finally{
            if (browser !== null) {
                await browser.close()
            }
        }
    }
    else{
        return res.status(400).json({status: 'Erro',
                                    message: 'Método não permitido.'});
    }   
}

async function getBrowserInstance() {
	const executablePath = await chromium.executablePath

	if (!executablePath) {
		// running locally
		const puppeteer = require('puppeteer-core')
		return puppeteer.launch({
			args: chromium.args,
			headless: true,
			defaultViewport: {
				width: 1280,
				height: 720
			},
			ignoreHTTPSErrors: true
		})
	}

	return chromium.puppeteer.launch({
		args: chromium.args,
		defaultViewport: {
			width: 1280,
			height: 720
		},
		executablePath,
		headless: chromium.headless,
		ignoreHTTPSErrors: true
	})
}