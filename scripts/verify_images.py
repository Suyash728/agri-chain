import os

images = {
    "arch": "extracted_docx_images/image_12_image4.png",
    "flowchart": "extracted_ppt_assets/slide_15_img_2.png",
    "dfd0": "docs/diagrams/dfd/dfd-level-0-context.png",
    "dfd1": "docs/diagrams/dfd/dfd-level-1-complete.png",
    "erd": "extracted_ppt_assets/slide_23_img_6.png",
    "usecase": "extracted_ppt_assets/slide_25_img_7.png",
    "gantt": "extracted_ppt_assets/slide_21_img_5.png",
    "cm": "extracted_docx_images/image_11_image13.png",
    "quarantine": "extracted_docx_images/image_14_image5.png",
    "farmer_dash": "extracted_docx_images/image_13_image3.jpg",
    "logistics_dash": "extracted_docx_images/image_16_image9.jpg",
    "logistics_ui": "extracted_docx_images/image_15_image6.jpg",
    "ai_trust_ui": "extracted_docx_images/image_1_image11.jpg",
    "darkstore_ui": "extracted_docx_images/image_3_image8.jpg",
    "admin_ui": "extracted_docx_images/image_2_image15.jpg",
    "consumer_ui": "extracted_docx_images/image_5_image12.jpg",
    "journey_ui": "extracted_docx_images/image_4_image16.jpg",
    "cert_ui": "extracted_docx_images/image_8_image14.jpg",
    "logo": "extracted_docx_images/image_10_image2.jpg"
}

for name, path in images.items():
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(f"{name:15}: exists={exists}, size={size} bytes, path={path}")
