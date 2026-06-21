from rest_framework.test import APITestCase
from rest_framework import status
from apps.academico.models import Modalidad, Carrera

BASE = "/api/academico"


class ModalidadAPITest(APITestCase):
    """Tests de los endpoints REST de Modalidad."""

    URL = f"{BASE}/modalidades"

    def setUp(self):
        self.modalidad = Modalidad(nombre="Presencial")
        self.modalidad.save()

    def _detail(self, pk=None):
        return f"{self.URL}/{pk or self.modalidad.id}"

    # --- LIST ---

    def test_list_modalidades_ok(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertIn("total", response.data)

    def test_list_modalidades_total(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.data["total"], 1)

    # --- RETRIEVE ---

    def test_retrieve_modalidad_ok(self):
        response = self.client.get(self._detail())
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "Presencial")

    def test_retrieve_modalidad_inexistente(self):
        response = self.client.get(self._detail(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- CREATE ---

    def test_create_modalidad_ok(self):
        response = self.client.post(self.URL, {"nombre": "Virtual"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Modalidad.objects.count(), 2)

    def test_create_modalidad_nombre_duplicado(self):
        response = self.client.post(self.URL, {"nombre": "Presencial"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_modalidad_nombre_muy_corto(self):
        response = self.client.post(self.URL, {"nombre": "AB"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_modalidad_nombre_vacio(self):
        response = self.client.post(self.URL, {"nombre": ""})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_modalidad_caracteres_invalidos(self):
        response = self.client.post(self.URL, {"nombre": "Modal123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- UPDATE ---

    def test_update_modalidad_ok(self):
        response = self.client.put(self._detail(), {"nombre": "Semipresencial"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.modalidad.refresh_from_db()
        self.assertEqual(self.modalidad.nombre, "Semipresencial")

    def test_update_modalidad_nombre_invalido(self):
        response = self.client.put(self._detail(), {"nombre": "AB"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- DELETE (soft) ---

    def test_delete_modalidad_ok(self):
        response = self.client.delete(self._detail())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.modalidad.refresh_from_db()
        self.assertFalse(self.modalidad.estado)
        self.assertEqual(Modalidad.objects.count(), 0)

    def test_delete_modalidad_con_carreras_activas(self):
        Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad).save()
        response = self.client.delete(self._detail())
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- ACCIONES CUSTOM ---

    def test_restore_modalidad(self):
        self.modalidad.delete()
        response = self.client.patch(f"{self._detail()}/restore")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.modalidad.refresh_from_db()
        self.assertTrue(self.modalidad.estado)

    def test_activas(self):
        response = self.client.get(f"{self.URL}/activas")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_inactivas(self):
        self.modalidad.delete()
        response = self.client.get(f"{self.URL}/inactivas")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CarreraAPITest(APITestCase):
    """Tests de los endpoints REST de Carrera."""

    URL = f"{BASE}/carreras"

    def setUp(self):
        self.modalidad = Modalidad(nombre="Presencial")
        self.modalidad.save()
        self.carrera = Carrera(
            nombre="Ingeniería de Software", modalidad=self.modalidad
        )
        self.carrera.save()

    def _detail(self, pk=None):
        return f"{self.URL}/{pk or self.carrera.id}"

    # --- LIST ---

    def test_list_carreras_ok(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)

    def test_list_carreras_total(self):
        response = self.client.get(self.URL)
        self.assertEqual(response.data["total"], 1)

    # --- RETRIEVE ---

    def test_retrieve_carrera_ok(self):
        response = self.client.get(self._detail())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_carrera_inexistente(self):
        response = self.client.get(self._detail(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- CREATE ---

    def test_create_carrera_ok(self):
        data = {"nombre": "Ingeniería Civil", "modalidad": self.modalidad.id}
        response = self.client.post(self.URL, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Carrera.objects.count(), 2)

    def test_create_carrera_nombre_duplicado(self):
        data = {"nombre": "Ingeniería de Software", "modalidad": self.modalidad.id}
        response = self.client.post(self.URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_carrera_sin_modalidad(self):
        response = self.client.post(self.URL, {"nombre": "Ingeniería Civil"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_carrera_nombre_muy_corto(self):
        data = {"nombre": "AB", "modalidad": self.modalidad.id}
        response = self.client.post(self.URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- UPDATE ---

    def test_update_carrera_ok(self):
        data = {"nombre": "Ingeniería Industrial", "modalidad": self.modalidad.id}
        response = self.client.put(self._detail(), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- DELETE (soft) ---

    def test_delete_carrera_ok(self):
        response = self.client.delete(self._detail())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.carrera.refresh_from_db()
        self.assertFalse(self.carrera.estado)

    # --- ACCIONES CUSTOM ---

    def test_restore_carrera(self):
        self.carrera.delete()
        response = self.client.patch(f"{self._detail()}/restore")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.carrera.refresh_from_db()
        self.assertTrue(self.carrera.estado)

    def test_hard_delete_carrera(self):
        response = self.client.delete(f"{self._detail()}/hard_delete")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Carrera.all_objects.count(), 0)

    def test_activas_carreras(self):
        response = self.client.get(f"{self.URL}/activas")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
