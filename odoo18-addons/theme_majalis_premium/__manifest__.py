{
    'name': 'Majalis Al Arab — Premium Website Theme (Staging)',
    'version': '18.0.0.1.0',
    'category': 'Website/Theme',
    'summary': 'Arabic RTL website design for Majalis Al Arab; keeps the native Odoo shop',
    'license': 'LGPL-3',
    'depends': ['website', 'website_sale'],
    'data': ['views/landing.xml'],
    'assets': {
        'web.assets_frontend': [
            'theme_majalis_premium/static/src/css/majalis_theme.css',
        ],
    },
    'application': False,
    'installable': True,
}
