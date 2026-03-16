from PIL import Image
import os

def make_transparent(img_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # If the pixel is very white, make it transparent
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(img_path.replace(".png", "_transparent.png"), "PNG")
    # Replace original for the app
    img.save("logo_final.png", "PNG")
    print("Transparent logo created.")

if __name__ == "__main__":
    make_transparent("c:/Users/thabe/Desktop/programming projects/python/Fault logger/frontend/public/logo.png")
