from collections import defaultdict

from werkzeug.exceptions import NotFound

from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request, route
from odoo.tools import format_amount


class MajalisShop(WebsiteSale):

    def _get_additional_extra_shop_values(self, values, **post):
        extra = super()._get_additional_extra_shop_values(values, **post)
        website = request.website
        if not website.majalis_luxe_store:
            return extra

        order = website.sale_get_order()
        variants = {}
        for product in values['products']:
            # Odoo's product page handles options, combinations and optional products.
            if (
                product.website_published
                and product.product_variant_count == 1
                and not product.attribute_line_ids
                and not product.optional_product_ids
                and product.type != 'combo'
                and product._is_add_to_cart_possible()
            ):
                variants[product.id] = product.product_variant_id.id

        extra.update(
            majalis_cart_quantity=order.cart_quantity or 0,
            majalis_cart_quantities=self._majalis_cart_quantities(order),
            majalis_quick_variants=variants,
        )
        return extra

    @staticmethod
    def _majalis_cart_quantities(order):
        quantities = defaultdict(float)
        for line in order.website_order_line.filtered('product_id'):
            quantities[line.product_template_id.id] += line.product_uom_qty
        return dict(quantities)

    @staticmethod
    def _majalis_line_editable(line):
        return (
            not line._is_not_sellable_line()
            and line.product_type != 'combo'
            and not line.linked_line_id
            and not line.linked_line_ids
        )

    @route('/shop/majalis/cart', type='json', auth='public', website=True, methods=['POST'])
    def majalis_cart_panel(self, line_id=None, delta=None):
        website = request.website
        if not website.majalis_luxe_store or not website.has_ecommerce_access():
            raise NotFound()

        order = website.sale_get_order()
        if order.state != 'draft':
            order = order.browse()
        warning = ''
        if line_id is not None or delta is not None:
            if type(line_id) is not int or type(delta) is not int or delta not in (-1, 1):
                raise NotFound()
            line = order.website_order_line.filtered(lambda item: item.id == line_id and item.product_id)
            if not line or not self._majalis_line_editable(line):
                warning = 'تغيّر هذا الصنف في السلة. راجع السلة الكاملة لتعديله.'
            else:
                result = self.cart_update_json(
                    product_id=line.product_id.id,
                    line_id=line.id,
                    add_qty=delta,
                    display=False,
                )
                warning = result.get('notification_info', {}).get('warning') or result.get('warning', '')
                order = website.sale_get_order()

        currency = order.currency_id or website.currency_id
        return {
            'quantity': order.cart_quantity or 0,
            'quantities': self._majalis_cart_quantities(order),
            'total': format_amount(request.env, order.amount_total or 0, currency),
            'lines': [{
                'id': line.id,
                'name': line.name_short,
                'quantity': line._get_displayed_quantity(),
                'price': format_amount(request.env, line._get_cart_display_price(), currency),
                'editable': self._majalis_line_editable(line),
            } for line in order.website_order_line.filtered('product_id')],
            'warning': warning,
        }
