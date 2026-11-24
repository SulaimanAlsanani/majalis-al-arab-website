{
    'name': 'Majalis Al Arab | Storefront',
    'summary': 'Arabic restaurant storefront for the Odoo eCommerce catalog',
    'version': '18.0.1.3.0',
    'category': 'Website/eCommerce',
    'author': 'Kayan',
    'license': 'LGPL-3',
    'depends': ['website_sale'],
    'data': [
        'views/res_config_settings.xml',
        'views/cart_panel.xml',
        'views/storefront.xml',
        'views/ordering.xml',
        'views/sale_order_views.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'majalis_luxe_store/static/src/css/storefront.css',
            'majalis_luxe_store/static/src/js/storefront.js',
        ],
    },
    'installable': True,
}
