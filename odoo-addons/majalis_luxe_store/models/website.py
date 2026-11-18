from odoo import fields, models


class Website(models.Model):
    _inherit = 'website'

    majalis_luxe_store = fields.Boolean(string='Majalis Al Arab storefront')


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    majalis_luxe_store = fields.Boolean(
        related='website_id.majalis_luxe_store',
        readonly=False,
    )
