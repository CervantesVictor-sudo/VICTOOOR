CREATE TRIGGER trg_restar_stock_venta
AFTER INSERT ON Detalle_Ventas
BEGIN
    -- 1. Actualizar el inventario restando la cantidad vendida
    UPDATE Producto
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;

    -- 2. Registrar el movimiento en la bitácora de inventarios
    INSERT INTO Movimiento_Inventario (
        id_producto, 
        tipo_movimiento, 
        cantidad, 
        fecha_movimiento, 
        motivo
    )
    VALUES (
        NEW.id_producto, 
        'SALIDA', 
        NEW.cantidad, 
        CURRENT_TIMESTAMP, 
        'Venta procesada (Ref Detalle: ' || NEW.id_detalle_venta || ')'
    );
END;