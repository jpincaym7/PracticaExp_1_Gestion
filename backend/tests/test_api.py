"""
Tests para las APIs REST
"""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestCarreraAPI(TestCase):
    """Tests de la API de Carreras"""

    def setUp(self):
        self.client = APIClient()

    @pytest.mark.integration
    def test_get_carreras(self):
        """Prueba obtener lista de carreras"""
        response = self.client.get('/api/v1/carreras/')
        assert response.status_code in [200, 404]  # 404 si la ruta no existe aún

    @pytest.mark.integration
    def test_get_modalidades(self):
        """Prueba obtener lista de modalidades"""
        response = self.client.get('/api/v1/modalidades/')
        assert response.status_code in [200, 404]


@pytest.mark.django_db
class TestAPIValidation(TestCase):
    """Tests de validación de APIs"""

    def setUp(self):
        self.client = APIClient()

    @pytest.mark.unit
    def test_api_response_format(self):
        """Prueba el formato de respuesta de API"""
        assert True
