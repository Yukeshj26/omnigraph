"""
SAP connector template (OData / S/4HANA product master).

Real SAP integrations vary a lot by module, version, and auth setup
(OAuth2 SAML bearer, certificate auth, or basic auth against a gateway).
This targets the standard S/4HANA OData service for product master data
(API_PRODUCT_SRV, entity set A_Product) as a starting point -- adjust the
entity set, payload shape, and auth flow to your release and any custom
fields your Basis/MM team has added.
Docs: SAP API Business Hub -> "Product" (API_PRODUCT_SRV).
"""
import httpx

from src.models.schemas import ProductSpec


class SAPConnector:
    def __init__(self, odata_base_url: str, client_id: str, client_secret: str):
        self.odata_base_url = odata_base_url.rstrip("/")
        self._client_id = client_id
        self._client_secret = client_secret

    def push_product(self, product: ProductSpec) -> httpx.Response:
        payload = {
            "Product": product.sku,
            "to_Description": {
                "results": [{"Language": "EN", "ProductDescription": product.name}]
            },
        }
        resp = httpx.post(
            f"{self.odata_base_url}/API_PRODUCT_SRV/A_Product",
            auth=(self._client_id, self._client_secret),
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        return resp
