#!/bin/bash
URL=$(curl -s -F "apikey=YOURKEYHERE" -F "files[]=@$1" https://www.shimapan.rocks/upload.php | grep url | awk '{print $2}')
echo $URL | tr -d '[\\\,"]'
