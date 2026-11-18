from collections import defaultdict

from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale


class MajalisShop(WebsiteSale):

    def _get_additional_extra_shop_values(self, values, **post):
        extra = super()._get_additional_extra_shop_values(values, **post)
        website = request.website
        if not website.majalis_luxe_store:
            return extra

        order = website.sale_get_order()
        quantities = defaultdict(float)
        for line in order.website_order_line:
            quantities[line.product_id.product_tmpl_id.id] += line.product_uom_qty

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
            majalis_cart_quantities=dict(quantities),
            majalis_quick_variants=variants,
        )
        return extra
