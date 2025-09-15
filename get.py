import requests
import json
from bs4 import BeautifulSoup
import re
import time

def get_attraction_details(url):
    headers = {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        'Accept-Encoding': "gzip, deflate, br, zstd",
        'sec-ch-ua': "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"137\", \"Chromium\";v=\"137\"",
        'sec-ch-ua-mobile': "?0",
        'sec-ch-ua-platform': "\"Windows\"",
        'DNT': "1",
        'Upgrade-Insecure-Requests': "1",
        'Sec-Fetch-Site': "none",
        'Sec-Fetch-Mode': "navigate",
        'Sec-Fetch-User': "?1",
        'Sec-Fetch-Dest': "document",
        'Accept-Language': "zh-TW,zh;q=0.9"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尋找基本資訊區塊
        info_section = soup.find('div', class_='section')
        if not info_section:
            return None, None, None
            
        # 尋找表格
        table = info_section.find('table')
        if not table:
            return None, None, None
            
        # 初始化變數
        duration = None
        capacity = None
        features = None
        
        # 遍歷表格行
        rows = table.find_all('tr')
        for row in rows:
            header = row.find('th')
            data = row.find('td')
            if not header or not data:
                continue
                
            header_text = header.text.strip()
            data_text = data.text.strip()
            
            if header_text == '所需時間':
                duration = data_text
            elif header_text == '可容納人數':
                capacity = data_text
            elif header_text == '特色':
                features = data_text
        
        return duration, capacity, features
        
    except Exception as e:
        print(f"Error fetching details for {url}: {str(e)}")
        return None, None, None

def get_attraction_data():
    url = "https://www.tokyodisneyresort.jp/tc/tdl/attraction.html"
    headers = {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        'Accept-Encoding': "gzip, deflate, br, zstd",
        'sec-ch-ua': "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
        'sec-ch-ua-mobile': "?0",
        'sec-ch-ua-platform': "\"Windows\"",
        'DNT': "1",
        'Upgrade-Insecure-Requests': "1",
        'Sec-Fetch-Site': "none",
        'Sec-Fetch-Mode': "navigate",
        'Sec-Fetch-User': "?1",
        'Sec-Fetch-Dest': "document",
        'Accept-Language': "zh-TW,zh;q=0.9"
    }

    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    countitems = response.text.count('<h3 class="heading3">')
    # 解析 HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 找到所有設施項目，包含所有 data-categorize 值
    attractions = []
    for i in range(1, countitems):  # 假設最多到9，實際執行時會自動停止
        items = soup.find_all('li', attrs={'data-categorize': str(i)})
        if not items:  # 如果找不到任何項目，表示已經沒有更多類別
            break
        attractions.extend(items)
    
    # 儲存結果的字典
    result = {}
    
    # 處理每個設施
    for attraction in attractions:
        # 取得設施連結並提取ID
        link = attraction.find('a')['href']
        match = re.search(r'/detail/(\d+)/', link)
        if not match:
            print(f"警告：無法從連結 {link} 中提取設施ID")
            continue
        attraction_id = match.group(1)
        
        # 取得圖片網址
        img_url = attraction.find('img')['src'].strip()
        
        # 取得設施地區
        area = attraction.find('p', class_='area').text.strip()
        
        # 取得設施類型
        attraction_type = attraction.find('div', class_='iconTag3')
        attraction_type = attraction_type.text.strip() if attraction_type else ''
        
        # 取得設施描述
        description = attraction.find('p', class_='text')
        description = description.text.strip() if description else ''
        
        # 取得設施名稱
        name = attraction.find('h3', class_='heading3').text.strip()
        
        # 構建完整URL
        full_url = f"https://www.tokyodisneyresort.jp{link}"
        
        # 獲取詳細資訊
        print(f"正在獲取 {name} 的詳細資訊...")
        duration, capacity, features = get_attraction_details(full_url)
        
        # 將資料存入結果字典
        result[attraction_id] = {
            'name': name,
            'img_url': img_url,
            'area': area,
            'type': attraction_type,
            'description': description,
            'link': link,
            'duration': duration,
            'capacity': capacity,
            'features': features
        }
        
        # 添加延遲以避免請求過快
        time.sleep(1)
    
    # 將結果寫入 JSON 檔案
    with open('attractions.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return result

if __name__ == '__main__':
    attractions = get_attraction_data()
    print(f'成功抓取 {len(attractions)} 個設施資訊')
