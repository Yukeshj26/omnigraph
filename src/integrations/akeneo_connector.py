"""
Akeneo PIM connector (REST API v1).

Requires AKENEO_BASE_URL, AKENEO_CLIENT_ID, AKENEO_CLIENT_SECRET,
AKENEO_USERNAME, AKENEO_PASSWORD in the environment (see .env.example).
Docs: https://api.akeneo.com/

This targets the common OAuth password-grant flow and the product PATCH
endpoint as a starting template -- validate the grant type, attribute
codes, and scopes against your specific Akeneo edition/version.
"""
import httpx

from src.models.schemas import ProductSpec


class AkeneoConnector:
    def __init__(self, base_url: str, client_id: str, client_secret: str, username: str, password: str):
        self.base_url = base_url.rstrip("/")
        self._client_id = client_id
        self._client_secret = client_secret
        self._username = username
        self._password = password
        self._token: str | None = None

    def _authenticate(self) -> str:
        resp = httpx.post(
            f"{self.base_url}/api/oauth/v1/token",
            auth=(self._client_id, self._client_secret),
            json={
                "grant_type": "password",
                "username": self._username,
                "password": self._password,
            },
            timeout=10,
        )
        resp.raise_for_status()
        self._token = resp.json()["access_token"]
        return self._token

    def push_product(self, product: ProductSpec) -> httpx.Response:
        token = self._token or self._authenticate()
        payload = {
            "identifier": product.sku,
            "values": {
                "name": [{"locale": "en_US", "scope": None, "data": product.name}],
                **{
                    attr.key: [{"locale": None, "scope": None, "data": attr.value}]
                    for attr in product.attributes
                },
            },
        }
        resp = httpx.patch(
            f"{self.base_url}/api/rest/v1/products/{product.sku}",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        return resp
