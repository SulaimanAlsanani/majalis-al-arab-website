from odoo import fields, models


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    majalis_preparation_note = fields.Text(string='ملاحظة تحضير الطلب', copy=False)
