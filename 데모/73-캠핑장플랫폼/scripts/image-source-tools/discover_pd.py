import json, urllib.parse, urllib.request
UA={'User-Agent':'campflow-demo/2.0 license audit'}
queries=['National Park Service tent camping','US Forest Service campground tent','public domain mountain lake landscape','BLM campground landscape','NPS campfire','NPS camping equipment','USFS campsite trailer']
for query in queries:
    params=urllib.parse.urlencode({'action':'query','generator':'search','gsrsearch':f'filetype:bitmap {query}','gsrnamespace':6,'gsrlimit':15,'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':1600,'format':'json'})
    req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+params,headers=UA)
    data=json.load(urllib.request.urlopen(req,timeout=30))
    print('\nQUERY',query)
    for page in (data.get('query',{}).get('pages',{}).values()):
        ii=(page.get('imageinfo') or [{}])[0]; em=ii.get('extmetadata',{})
        lic=em.get('LicenseShortName',{}).get('value','')
        if any(x in lic.lower() for x in ['public domain','cc0','pdm']):
            print(page.get('title'),'|',lic,'|',ii.get('width'),ii.get('height'),'|',ii.get('descriptionurl'))
