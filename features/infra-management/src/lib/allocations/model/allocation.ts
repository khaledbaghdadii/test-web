export interface DatabaseInstanceAllocationRequest {
  databaseSnapshotId: string;
  type: AllocationRequestType.DATABASE_INSTANCE;
}

export interface MachineResourceAllocationRequest {
  type: AllocationRequestType.MACHINE_RESOURCE;
  servers?: ServerAllocationRequest[];
}

export enum AllocationRequestType {
  DATABASE_INSTANCE = "database_instance",
  MACHINE_RESOURCE = "machine_resource",
}

export interface ServerAllocationRequest {
  type: ServerType;
}

export enum ServerType {
  APPLICATION = "APPLICATION",
  CLIENT = "CLIENT",
  TEST = "TEST",
  GRID = "GRID",
  ORACLE = "ORACLE",
  SYBASE = "SYBASE",
  MSSQL = "MSSQL",
  POSTGRES = "POSTGRES",
}
