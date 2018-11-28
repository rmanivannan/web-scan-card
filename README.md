# web-scan-card
{WIP ....&lt;/>} Web &amp; JavaScript based OCR Card scanner


Steps involved 

1. Openup camera & Capture Card image
2. Pass the image to canvas to get image data
3. Separate Card from BG
4. Convert color image to binary image(pure black & white, no gradient in between 0 & 255)
6. Apply thinning algoritnm 
7. Get the connect thinned pixcels as group
8. Compare each group with Numerics and Alphabets of sample data(variouse fonts) - TBD elaborate comparison logics by varicose zoom, shrinker, whide ...
9. Pick the closest matchs as output data
10. Group Card number, name and exp from the results got
