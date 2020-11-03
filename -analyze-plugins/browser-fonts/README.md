Research:
Research paper about glyphs rendering differently on browsers (common technique to measure these glyphs):
https://www.bamsoftware.com/papers/fontfp.pdf

Libs: 
- https://github.com/bramstein/fontfaceobserver
- https://github.com/google/fonts

Install google fonts on Ubuntu
```
cd /usr/share/fonts
sudo mkdir googlefonts
cd googlefonts
sudo unzip -d . ~/Downloads/Open_Sans.zip
sudo chmod -R --reference=/usr/share/fonts/opentype /usr/share/fonts/googlefonts
```
